/// <reference types="react-scripts" />

declare namespace React {
  interface FormEvent<T = Element> extends SyntheticEvent<T> {
    readonly target: EventTarget & T;
    preventDefault(): void;
  }

  interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
    readonly target: EventTarget & T;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
} 