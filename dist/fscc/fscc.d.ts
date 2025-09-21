declare global {
    interface Window {
        FsCC: FsCC;
    }
}
export interface FsCC {
    banner: any;
    consentController: any;
    manager: any;
    preferences: {
        store: {
            consents: FsConsents;
        };
    };
    store: any;
}
export interface FsConsents {
    essential: true;
    marketing: boolean;
    personalisation: boolean;
    analytics: boolean;
}
export declare function getFsCC(): FsCC;
export declare function getFsConsents(): FsConsents;
