declare namespace daum {
  class Postcode {
    constructor(options: {
      oncomplete: (data: {
        address: string;
        roadAddress: string;
        jibunAddress: string;
        zonecode: string;
      }) => void;
      onclose?: () => void;
    });
    open(): void;
    embed(element: HTMLElement): void;
  }
}
