-- 프로젝트 회비 독립 여부 설정
-- true = 독립적인 프로젝트 회비 (그룹 회비에 포함되지 않음)
-- false = 그룹 회비에 통합 (기본값)
ALTER TABLE projects ADD COLUMN finance_independent BOOLEAN DEFAULT false;
