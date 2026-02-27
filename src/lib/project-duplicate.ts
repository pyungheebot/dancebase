import type { SupabaseClient } from "@supabase/supabase-js";

export type DuplicateOptions = {
  boardCategories: boolean;
  financeCategories: boolean;
  scheduleTemplates: boolean;
  includeMembers: boolean;
};

export type DuplicateResult = {
  newProjectId: string | null;
  error: string | null;
};

/**
 * 기존 프로젝트를 복제하여 새 프로젝트를 생성합니다.
 * - 원본 프로젝트 기본 정보 조회
 * - 새 프로젝트 INSERT
 * - 선택된 항목(게시판 카테고리, 회비 카테고리, 일정 템플릿) 복사
 * - 복제한 사용자를 project_members에 leader로 추가
 */
export async function duplicateProject(
  supabase: SupabaseClient,
  sourceProjectId: string,
  newName: string,
  userId: string,
  options: DuplicateOptions
): Promise<DuplicateResult> {
  // 1. 원본 프로젝트 조회
  const { data: source, error: sourceError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", sourceProjectId)
    .single();

  if (sourceError || !source) {
    return {
      newProjectId: null,
      error: "원본 프로젝트를 불러오는데 실패했습니다.",
    };
  }

  // 2. 새 프로젝트 INSERT
  const { data: newProject, error: insertError } = await supabase
    .from("projects")
    .insert({
      group_id: source.group_id,
      name: newName.trim(),
      description: source.description,
      type: source.type,
      status: "신규",
      visibility: source.visibility,
      enabled_features: source.enabled_features,
      created_by: userId,
    })
    .select("id")
    .single();

  if (insertError || !newProject) {
    return {
      newProjectId: null,
      error: "새 프로젝트 생성에 실패했습니다.",
    };
  }

  const newProjectId = newProject.id;

  // 3. 복제한 사용자를 leader로 project_members에 추가
  const { error: memberError } = await supabase
    .from("project_members")
    .insert({
      project_id: newProjectId,
      user_id: userId,
      role: "leader",
    });

  if (memberError) {
    // 멤버 추가 실패는 치명적이지 않으므로 경고만 로그
    console.warn("프로젝트 멤버 추가 실패:", memberError.message);
  }

  // 4. 멤버 구성 복사 (복제한 사용자 본인 제외)
  if (options.includeMembers) {
    const { data: sourceMembers } = await supabase
      .from("project_members")
      .select("user_id, role")
      .eq("project_id", sourceProjectId)
      .neq("user_id", userId); // 복제한 사용자는 이미 leader로 추가됨

    if (sourceMembers && sourceMembers.length > 0) {
      const toInsert = sourceMembers.map((m) => ({
        project_id: newProjectId,
        user_id: m.user_id,
        role: m.role,
      }));

      const { error: membersInsertError } = await supabase
        .from("project_members")
        .insert(toInsert);

      if (membersInsertError) {
        console.warn("멤버 복사 실패:", membersInsertError.message);
      }
    }
  }

  // 5. 게시판 카테고리 복사 (board_categories는 group_id 기준)
  if (options.boardCategories) {
    const { data: boardCats } = await supabase
      .from("board_categories")
      .select("name, sort_order")
      .eq("group_id", source.group_id)
      .order("sort_order");

    if (boardCats && boardCats.length > 0) {
      // board_categories는 group_id + name UNIQUE 제약이 있으므로
      // 이름이 겹치는 경우 upsert로 처리
      const toInsert = boardCats.map((cat) => ({
        group_id: source.group_id,
        name: `[복제] ${cat.name}`,
        sort_order: cat.sort_order,
      }));

      await supabase
        .from("board_categories")
        .upsert(toInsert, { onConflict: "group_id,name", ignoreDuplicates: true });
    }
  }

  // 6. 회비 카테고리 복사 (finance_categories는 project_id 기준)
  if (options.financeCategories) {
    const { data: financeCats } = await supabase
      .from("finance_categories")
      .select("name, sort_order")
      .eq("group_id", source.group_id)
      .eq("project_id", sourceProjectId)
      .order("sort_order");

    if (financeCats && financeCats.length > 0) {
      const toInsert = financeCats.map((cat) => ({
        group_id: source.group_id,
        project_id: newProjectId,
        name: cat.name,
        sort_order: cat.sort_order,
      }));

      await supabase
        .from("finance_categories")
        .insert(toInsert);
    }
  }

  // 7. 일정 템플릿 복사
  if (options.scheduleTemplates) {
    const { data: templates } = await supabase
      .from("schedule_templates")
      .select("name, title, description, location, duration_minutes")
      .eq("entity_type", "project")
      .eq("entity_id", sourceProjectId)
      .order("created_at");

    if (templates && templates.length > 0) {
      const toInsert = templates.map((tpl) => ({
        entity_type: "project" as const,
        entity_id: newProjectId,
        name: tpl.name,
        title: tpl.title,
        description: tpl.description,
        location: tpl.location,
        duration_minutes: tpl.duration_minutes,
        created_by: userId,
      }));

      await supabase
        .from("schedule_templates")
        .insert(toInsert);
    }
  }

  return { newProjectId, error: null };
}
