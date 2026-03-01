import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDialogForm } from "@/hooks/use-dialog-form";

describe("useDialogForm - 초기 상태", () => {
  it("초기 open은 false이다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "", email: "" })
    );

    expect(result.current.open).toBe(false);
  });

  it("초기 values는 defaultValues와 같다", () => {
    const defaultValues = { name: "홍길동", role: "member" };

    const { result } = renderHook(() => useDialogForm(defaultValues));

    expect(result.current.values).toEqual(defaultValues);
  });

  it("빈 객체를 defaultValues로 사용할 수 있다", () => {
    const { result } = renderHook(() => useDialogForm({}));

    expect(result.current.values).toEqual({});
    expect(result.current.open).toBe(false);
  });
});

describe("useDialogForm - setOpen", () => {
  it("setOpen(true) 호출 시 open=true가 된다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "" })
    );

    act(() => {
      result.current.setOpen(true);
    });

    expect(result.current.open).toBe(true);
  });

  it("setOpen(false) 호출 시 open=false가 된다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "" })
    );

    act(() => {
      result.current.setOpen(true);
    });
    act(() => {
      result.current.setOpen(false);
    });

    expect(result.current.open).toBe(false);
  });
});

describe("useDialogForm - setValue", () => {
  it("setValue로 단일 필드를 업데이트한다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "", email: "" })
    );

    act(() => {
      result.current.setValue("name", "김철수");
    });

    expect(result.current.values.name).toBe("김철수");
    expect(result.current.values.email).toBe(""); // 다른 필드 유지
  });

  it("setValue를 여러 번 호출해도 각 필드가 독립적으로 업데이트된다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "", email: "", role: "member" })
    );

    act(() => {
      result.current.setValue("name", "이영희");
    });
    act(() => {
      result.current.setValue("email", "lee@example.com");
    });

    expect(result.current.values.name).toBe("이영희");
    expect(result.current.values.email).toBe("lee@example.com");
    expect(result.current.values.role).toBe("member");
  });

  it("setValue로 숫자 필드를 업데이트한다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ count: 0, label: "" })
    );

    act(() => {
      result.current.setValue("count", 42);
    });

    expect(result.current.values.count).toBe(42);
  });
});

describe("useDialogForm - setValues", () => {
  it("setValues로 여러 필드를 한 번에 업데이트한다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "", email: "", role: "member" })
    );

    act(() => {
      result.current.setValues({ name: "박민준", email: "park@example.com" });
    });

    expect(result.current.values.name).toBe("박민준");
    expect(result.current.values.email).toBe("park@example.com");
    expect(result.current.values.role).toBe("member"); // 변경 안 한 필드 유지
  });

  it("setValues로 모든 필드를 업데이트한다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "", email: "" })
    );

    act(() => {
      result.current.setValues({ name: "최지우", email: "choi@example.com" });
    });

    expect(result.current.values).toEqual({
      name: "최지우",
      email: "choi@example.com",
    });
  });

  it("setValues로 빈 업데이트를 호출해도 값이 유지된다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "홍길동", email: "hong@example.com" })
    );

    act(() => {
      result.current.setValues({});
    });

    expect(result.current.values.name).toBe("홍길동");
    expect(result.current.values.email).toBe("hong@example.com");
  });
});

describe("useDialogForm - handleOpenChange (resetOnClose=true 기본값)", () => {
  it("handleOpenChange(false) 호출 시 open=false가 된다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "" })
    );

    act(() => {
      result.current.handleOpenChange(true);
    });
    act(() => {
      result.current.handleOpenChange(false);
    });

    expect(result.current.open).toBe(false);
  });

  it("handleOpenChange(false) 호출 시 values가 defaultValues로 초기화된다 (resetOnClose=true)", () => {
    const defaultValues = { name: "", email: "" };

    const { result } = renderHook(() => useDialogForm(defaultValues));

    // 값 변경 후 닫기
    act(() => {
      result.current.setValue("name", "수정된 이름");
      result.current.setValue("email", "test@test.com");
    });
    expect(result.current.values.name).toBe("수정된 이름");

    act(() => {
      result.current.handleOpenChange(false);
    });

    expect(result.current.values).toEqual(defaultValues);
  });

  it("handleOpenChange(true) 호출 시 값이 초기화되지 않는다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "", role: "member" })
    );

    act(() => {
      result.current.setValue("name", "변경된 이름");
    });
    act(() => {
      result.current.handleOpenChange(true);
    });

    // 여는 건 값에 영향을 주지 않음
    expect(result.current.values.name).toBe("변경된 이름");
  });

  it("handleOpenChange(false) 호출 시 onClose 콜백이 호출된다", () => {
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useDialogForm({ name: "" }, { onClose })
    );

    act(() => {
      result.current.handleOpenChange(false);
    });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("handleOpenChange(true) 호출 시 onClose 콜백이 호출되지 않는다", () => {
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useDialogForm({ name: "" }, { onClose })
    );

    act(() => {
      result.current.handleOpenChange(true);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("useDialogForm - handleOpenChange (resetOnClose=false)", () => {
  it("handleOpenChange(false) 호출 시 resetOnClose=false이면 values가 유지된다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "", email: "" }, { resetOnClose: false })
    );

    act(() => {
      result.current.setValue("name", "유지할 이름");
    });
    act(() => {
      result.current.handleOpenChange(false);
    });

    expect(result.current.values.name).toBe("유지할 이름");
    expect(result.current.open).toBe(false);
  });

  it("resetOnClose=false에서도 onClose 콜백은 호출된다", () => {
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useDialogForm({ name: "" }, { onClose, resetOnClose: false })
    );

    act(() => {
      result.current.handleOpenChange(false);
    });

    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("useDialogForm - reset", () => {
  it("reset 호출 시 values가 defaultValues로 복원된다", () => {
    const defaultValues = { name: "기본이름", count: 0 };

    const { result } = renderHook(() => useDialogForm(defaultValues));

    act(() => {
      result.current.setValue("name", "변경된이름");
      result.current.setValue("count", 99);
    });
    expect(result.current.values.name).toBe("변경된이름");

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(defaultValues);
  });

  it("reset 후 open 상태는 변경되지 않는다", () => {
    const { result } = renderHook(() =>
      useDialogForm({ name: "" })
    );

    act(() => {
      result.current.setOpen(true);
    });
    act(() => {
      result.current.reset();
    });

    // open은 reset에 영향 없음
    expect(result.current.open).toBe(true);
  });

  it("reset을 여러 번 호출해도 항상 defaultValues로 복원된다", () => {
    const defaultValues = { title: "기본제목" };

    const { result } = renderHook(() => useDialogForm(defaultValues));

    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.setValue("title", `제목 ${i}`);
      });
      act(() => {
        result.current.reset();
      });
      expect(result.current.values).toEqual(defaultValues);
    }
  });
});
