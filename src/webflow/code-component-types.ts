export interface WebflowContext {
  mode: "publish" | "design" | "build" | string;
  interactive: boolean;
  locale: string;
}

export interface CodeIslandDataset<T extends CodeIslandProps> {
  props: T;
  slots: unknown[];
  webflowContext: WebflowContext;
}

export interface CodeIslandRendererOptions {
  webflowContext: WebflowContext;
  onError: () => void;
}

export interface CodeIslandRenderer<T extends CodeIslandProps = CodeIslandProps> {
  mount(rootElement: HTMLElement): unknown;
  hydrate(root: unknown, props?: T, options?: CodeIslandRendererOptions): unknown;
  render(root: unknown, props?: T, options?: CodeIslandRendererOptions): void;
  createSlot(name: string): Element;
}

export interface CodeIslandProps {
  [x: string]: unknown;
}

export interface HTMLCodeIslandElement<T extends CodeIslandProps = CodeIslandProps> extends HTMLElement {
  componentName: string;

  /** Webflow internal renderer */
  renderer: CodeIslandRenderer<T>;

  /** React root */
  root: unknown | null;

  /** The shadow root where the code component is rendered */
  shadowRoot: ShadowRoot;

  /** The root element in the shadowRoot */
  rootElement: HTMLElement | null;

  /** Component Props */
  props?: T;
  slots?: any[];
  webflowContext?: WebflowContext;

  /** True if the component was rendered server side */
  isSsrHydration?: boolean;

  /** Render the code component */
  render(props?: T, slots?: any[], webflowContext?: WebflowContext): void;

  parseDataset(): CodeIslandDataset<T>;

  getAnalyticsMetadata(): any;

  attachShadow();
  setupShadowRootInteraction();
  validateShadowRootStructure();
}

export interface WebflowCodeComponentsManifest {
  type: string;
  version: number;
  entry: string;
  renderer: string;
  components: Record<string, { css: string[] }>;
}

export interface CodeIslandLoader {
  tag: string;
  val: {
    clientModuleUrl: string;
    moduleId: string;
    submoduleId: string;
    exportPath: string;
    serverModuleUrl: string;
  };
}
