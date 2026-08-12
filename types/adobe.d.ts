import type { EnumToInterface, EnumToUnion } from "./utils";

export enum CallbackType {
  SAVE_API = "SAVE_API",
  STATUS_API = "STATUS_API",
  EVENT_LISTENER = "EVENT_LISTENER",
  SET_USER_SETTING_API = "SET_USER_SETTING_API",
  GET_USER_SETTING_API = "GET_USER_SETTING_API",
  GET_USER_PROFILE_API = "GET_USER_PROFILE_API",
}

export enum ApiResponseCode {
  SUCCESS = "SUCCESS",
  FAIL = "FAIL",
  INVALID_ANNOTATION_ID = "INVALID_ANNOTATION_ID",
  INVALID_ANNOTATION = "INVALID_ANNOTATION",
  INVALID_PAGE_RANGE = "INVALID_PAGE_RANGE",
  INVALID_CONFIG = "INVALID_CONFIG",
  INVALID_ANNOTATION_MODE = "INVALID_ANNOTATION_MODE",
  INVALID_OPTIONS = "INVALID_OPTIONS",
  INVALID_INPUT = "INVALID_INPUT",
  IGNORE_FAIL = "IGNORE_FAIL",
  FILE_MODIFIED = "FILE_MODIFIED",
  PREVIEW_RENDERING_FAILED = "PREVIEW_RENDERING_FAILED",
  USER_CANCELLED = "USER_CANCELLED",
  INVALID_THUMBNAIL_FORMAT = "INVALID_THUMBNAIL_FORMAT",
  INVALID_ZOOM_LEVEL = "INVALID_ZOOM_LEVEL",
}

export enum EventType {
  VIEWER_UNMOUNT = "VIEWER_UNMOUNT",
  PDF_VIEWER_OPEN = "PDF_VIEWER_OPEN",
  PDF_VIEWER_CLOSE = "PDF_VIEWER_CLOSE",
  APP_RENDERING_START = "APP_RENDERING_START",
  APP_RENDERING_DONE = "APP_RENDERING_DONE",
  APP_RENDERING_FAILED = "APP_RENDERING_FAILED",
  ACTION_ICONS = "ACTION_ICONS",
  SEARCH_UI_TOGGLE = "SEARCH_UI_TOGGLE",
  FILE_STATUS = "FILE_STATUS",
  FULL_SCREEN_TOGGLE = "FULL_SCREEN_TOGGLE",
  FILE_DOWNLOAD_FAILED = "FILE_DOWNLOAD_FAILED",
  PDF_VIEWER_READY = "PDF_VIEWER_READY",
  FIRST_AJS_PAGE_RENDERED = "FIRST_AJS_PAGE_RENDERED",
  FILE_LINEARIZATION_STATUS = "FILE_LINEARIZATION_STATUS",
}

export enum PDFAnalyticsEvents {
  DOCUMENT_OPEN = "DOCUMENT_OPEN",
  PAGE_VIEW = "PAGE_VIEW",
  DOCUMENT_DOWNLOAD = "DOCUMENT_DOWNLOAD",
  DOCUMENT_PRINT = "DOCUMENT_PRINT",
  TEXT_SEARCH = "TEXT_SEARCH",
  BOOKMARK_ITEM_CLICK = "BOOKMARK_ITEM_CLICK",
  HYPERLINK_OPEN = "HYPERLINK_OPEN",
  TEXT_COPY = "TEXT_COPY",
  ZOOM_LEVEL = "ZOOM_LEVEL",
}

export enum FilePreviewEvents {
  PREVIEW_KEY_DOWN = "PREVIEW_KEY_DOWN",
  PREVIEW_PAGE_VIEW_SCROLLED = "PREVIEW_PAGE_VIEW_SCROLLED",
  PREVIEW_DOCUMENT_CLICK = "PREVIEW_DOCUMENT_CLICK",
  PREVIEW_PAGE_CLICK = "PREVIEW_PAGE_CLICK",
  PREVIEW_PAGE_DOUBLE_CLICK = "PREVIEW_PAGE_DOUBLE_CLICK",
  PREVIEW_PAGE_HOVER = "PREVIEW_PAGE_HOVER",
  PREVIEW_PAGE_MOUSE_ENTER = "PREVIEW_PAGE_MOUSE_ENTER",
  PREVIEW_PAGE_MOUSE_LEAVE = "PREVIEW_PAGE_MOUSE_LEAVE",
  CURRENT_ACTIVE_PAGE = "CURRENT_ACTIVE_PAGE",
  PREVIEW_SELECTION_END = "PREVIEW_SELECTION_END",
  VIEW_MODE_CHANGE = "VIEW_MODE_CHANGE",
  PREVIEW_ZOOM = "PREVIEW_ZOOM",
  PAGES_IN_VIEW_CHANGE = "PAGES_IN_VIEW_CHANGE",
  UNSUPPORTED_FEATURE_FOUND = "UNSUPPORTED_FEATURE_FOUND",
  PREVIEW_ERROR_EVENTS = "PREVIEW_ERROR_EVENTS",
  EDIT_PRE_PROCESSING_INITIATED = "EDIT_PRE_PROCESSING_INITIATED",
  EDIT_ENTER_SUCCESSFUL = "EDIT_ENTER_SUCCESSFUL",
  HANDLE_ENTER_EDIT = "HANDLE_ENTER_EDIT",
  SUBMIT_FORM = "SUBMIT_FORM",
  HANDLE_EDIT_UPSELL = "HANDLE_EDIT_UPSELL",
  OPEN_DOCUMENT_IN_DESKTOP = "OPEN_DOCUMENT_IN_DESKTOP",
  HANDLE_OPEN_NATIVE_APP = "HANDLE_OPEN_NATIVE_APP",
  CONTEXT_MENU_ITEM_CLICKED = "CONTEXT_MENU_ITEM_CLICKED",
  GENAI_OPERATION_PERFORMED = "GENAI_OPERATION_PERFORMED",
  DIGITAL_SIGNATURE_VALIDATION_STATUS_UPDATED = "DIGITAL_SIGNATURE_VALIDATION_STATUS_UPDATED",
  EDIT_TOOLS_USED = "EDIT_TOOLS_USED",
  FALLBACK_PRINT = "FALLBACK_PRINT",
  WAITING_ON_COMPLETE_PDF_BUFFER = "WAITING_ON_COMPLETE_PDF_BUFFER",
  HANDLE_EDIT_KEYBOARD_SHORTCUT = "HANDLE_EDIT_KEYBOARD_SHORTCUT",
  DOCUMENT_VIEW_THEME_CHANGE = "DOCUMENT_VIEW_THEME_CHANGE",
  HANDLE_EDIT_LOCAL_FONT_PRIMING_DIALOG_EVENTS = "HANDLE_EDIT_LOCAL_FONT_PRIMING_DIALOG_EVENTS",
  TOUCH_START = "TOUCH_START",
  TOUCH_END = "TOUCH_END",
  FULL_SCREEN_VIEW_ENTRY = "FULL_SCREEN_VIEW_ENTRY",
  FULL_SCREEN_VIEW_EXIT = "FULL_SCREEN_VIEW_EXIT",
}

export enum AnnotationTypes {
  HIGHLIGHT = "highlight",
  STRIKEOUT = "strikeout",
  UNDERLINE = "underline",
  SHAPE = "shape",
  NOTE = "note",
  FREETEXT = "freetext",
}

export enum AnnotationEvents {
  ANNOTATION_ADDED = "ANNOTATION_ADDED",
  ANNOTATION_UPDATED = "ANNOTATION_UPDATED",
  ANNOTATION_DELETED = "ANNOTATION_DELETED",
  ANNOTATION_SELECTED = "ANNOTATION_SELECTED",
  ANNOTATION_UNSELECTED = "ANNOTATION_UNSELECTED",
  ANNOTATION_MODE_STARTED = "ANNOTATION_MODE_STARTED",
  ANNOTATION_MODE_ENDED = "ANNOTATION_MODE_ENDED",
  ANNOTATION_CLICKED = "ANNOTATION_CLICKED",
  ANNOTATION_MOUSE_OVER = "ANNOTATION_MOUSE_OVER",
  ANNOTATION_MOUSE_OUT = "ANNOTATION_MOUSE_OUT",
  ANNOTATION_COUNT = "ANNOTATION_COUNT",
}

export enum ViewMode {
  FIT_WIDTH = "FIT_WIDTH",
  FIT_PAGE = "FIT_PAGE",
  TWO_COLUMN = "TWO_COLUMN",
  CONTINUOUS = "CONTINUOUS",
  SINGLE_PAGE = "SINGLE_PAGE",
  TWO_COLUMN_FIT_PAGE = "TWO_COLUMN_FIT_PAGE",
  TWO_COLUMN_FIT_WIDTH = "TWO_COLUMN_FIT_WIDTH",
  FIT_ONE_FULL_PAGE = "FIT_ONE_FULL_PAGE",
}

export enum EmbedMode {
  FULL_WINDOW = "FULL_WINDOW",
  SIZED_CONTAINER = "SIZED_CONTAINER",
  IN_LINE = "IN_LINE",
  LIGHT_BOX = "LIGHT_BOX",
}

interface FileConfig {
  content: {
    /** Location of the PDF file (URL or Promise of ArrayBuffer/Blob) */
    location: { url: string } | Promise<ArrayBuffer | Blob>;
  };
  metaData: {
    /** File name to be displayed */
    fileName: string;
    /** Unique identifier for the document */
    id?: string;
  };
}

interface ViewerConfig {
  embedMode?: "FULL_WINDOW" | "SIZED_CONTAINER" | "IN_LINE" | "LIGHT_BOX";
  defaultViewMode?: "FIT_PAGE" | "FIT_WIDTH";
  showAnnotationTools?: boolean;
  showLeftHandPanel?: boolean;
  showPageControls?: boolean;
  showDownloadPDF?: boolean;
  showPrintPDF?: boolean;
}

// The result object returned by the previewFile promise
interface AdobeViewerAPIs {
  getAnnotationManager(): Promise<any>;
  getAPIs(): Promise<any>;
}

interface RegisterCallbackEvent {
  type: EventType | EnumToUnion<EventType>;
  data: any;
}

interface View {
  /**
   * Initializes the Adobe View SDK.
   * @param options Configuration containing clientId and divId.
   */
  new (options: { clientId: string; divId?: string; locale?: string }): View;

  /**
   * Preview a PDF file.
   * @param fileConfig Configuration for the PDF source.
   * @param viewerConfig UI configuration for the viewer.
   */
  previewFile(fileConfig: FileConfig, viewerConfig?: ViewerConfig): Promise<AdobeViewerAPIs>;

  /**
   * Register a callback for SDK events.
   */
  registerCallback(
    event: CallbackType | EnumToUnion<CallbackType>,
    handler: (event: RegisterCallbackEvent) => void,
    options?: any,
  ): void;

  Enum: {
    CallbackType: EnumToInterface<typeof CallbackType>;
    ApiResponseCode: Record<ApiResponseCode, `${ApiResponseCode}`>;
    Events: Record<EventType, `${EventType}`>;
    PDFAnalyticsEvents: Record<PDFAnalyticsEvents, `${PDFAnalyticsEvents}`>;
    FilePreviewEvents: Record<FilePreviewEvents, `${FilePreviewEvents}`>;
    AnnotationTypes: Record<AnnotationTypes, `${AnnotationTypes}`>;
    AnnotationEvents: Record<AnnotationEvents, `${AnnotationEvents}`>;
    ViewMode: Record<ViewMode, `${ViewMode}`>;
    EmbedMode: Record<EmbedMode, `${EmbedMode}`>;
  };
}

export interface AdobeDC {
  View: View;
}

declare global {
  interface Window {
    AdobeDC: AdobeDC;
  }
}
