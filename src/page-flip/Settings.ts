/*
 * :file description: 
 * :name: /react-pageflip-master/src/page-flip/Settings.ts
 * :author: PTC
 * :copyright: (c) 2026, Tungee
 * :date created: 2021-04-18 23:11:19
 * :last editor: PTC
 * :date last edited: 2026-02-08 00:15:12
 */
/**
 * Book size calculation type
 */
export type SizeType = 'fixed' | 'stretch';

export const SizeType = {
    /** Dimensions are fixed */
    FIXED: 'fixed' as SizeType,
    /** Dimensions are calculated based on the parent element */
    STRETCH: 'stretch' as SizeType,
};

/**
 * Configuration object
 */
export interface FlipSetting {
    /** Page number from which to start viewing */
    startPage: number;
    /** Whether the book will be stretched under the parent element or not */
    size: SizeType;

    width: number;
    height: number;

    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;

    /** Draw shadows or not when page flipping */
    drawShadow: boolean;
    /** Flipping animation time */
    flippingTime: number;

    /** Enable switching to portrait mode */
    usePortrait: boolean;
    /** Initial value to z-index */
    startZIndex: number;
    /** If this value is true, the parent element will be equal to the size of the book */
    autoSize: boolean;
    /** Shadow intensity (1: max intensity, 0: hidden shadows) */
    maxShadowOpacity: number;

    /** If this value is true, the first and the last pages will be marked as hard and will be shown in single page mode */
    showCover: boolean;
    /** Disable content scrolling when touching a book on mobile devices */
    mobileScrollSupport: boolean;

    /** Set the forward event of clicking on child elements (buttons, links) */
    clickEventForward: boolean;

    /** Using mouse and touch events to page flipping */
    useMouseEvents: boolean;

    swipeDistance: number;

    /** if this value is true, fold the corners of the book when the mouse pointer is over them. */
    showPageCorners: boolean;

    /** if this value is true, flipping by clicking on the whole book will be locked. Only on corners */
    disableFlipByClick: boolean;

    /** If true, only one page is shown at a time with flip animation */
    singlePage: boolean;
}

export class Settings {
    private _default: FlipSetting = {
        startPage: 0,
        size: SizeType.FIXED,
        width: 0,
        height: 0,
        minWidth: 0,
        maxWidth: 0,
        minHeight: 0,
        maxHeight: 0,
        drawShadow: true,
        flippingTime: 1000,
        usePortrait: true,
        startZIndex: 0,
        autoSize: true,
        maxShadowOpacity: 1,
        showCover: false,
        mobileScrollSupport: true,
        swipeDistance: 30,
        clickEventForward: true,
        useMouseEvents: true,
        showPageCorners: true,
        disableFlipByClick: false,
        singlePage: false,
    };

    /**
     * Processing parameters received from the user. Substitution default values
     *
     * @param userSetting
     * @returns {FlipSetting} Сonfiguration object
     */
    public getSettings(userSetting: Record<string, any>): FlipSetting {
        const result = this._default;
        Object.assign(result, userSetting);

        if (result.size !== SizeType.STRETCH && result.size !== SizeType.FIXED)
            throw new Error('Invalid size type. Available only "fixed" and "stretch" value');

        if (result.width <= 0 || result.height <= 0) throw new Error('Invalid width or height');

        if (result.flippingTime <= 0) throw new Error('Invalid flipping time');

        if (result.size === SizeType.STRETCH) {
            if (result.minWidth <= 0) result.minWidth = 100;

            if (result.maxWidth < result.minWidth) result.maxWidth = 2000;

            if (result.minHeight <= 0) result.minHeight = 100;

            if (result.maxHeight < result.minHeight) result.maxHeight = 2000;
        } else {
            result.minWidth = result.width;
            result.maxWidth = result.width;
            result.minHeight = result.height;
            result.maxHeight = result.height;
        }

        return result;
    }
}
