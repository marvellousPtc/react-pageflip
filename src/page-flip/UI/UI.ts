import { PageFlip } from '../PageFlip';
import { Point } from '../BasicTypes';
import { FlipSetting, SizeType } from '../Settings';
import { FlipCorner, FlippingState } from '../Flip/Flip';
import { Orientation } from '../Render/Render';

type SwipeData = {
    point: Point;
    time: number;
};

/**
 * UI Class, represents work with DOM
 */
export abstract class UI {
    protected readonly parentElement: HTMLElement;

    protected readonly app: PageFlip;
    protected readonly wrapper: HTMLElement;
    protected distElement: HTMLElement;

    private touchPoint: SwipeData = null;
    private readonly swipeTimeout = 250;
    private readonly swipeDistance: number;

    /** 标记滑动已在 touchMove 中处理，touchEnd 不再重复处理 */
    private swipeDetected = false;

    private onResize = (): void => {
        this.update();
    };

    /**
     * @constructor
     *
     * @param {HTMLElement} inBlock - Root HTML Element
     * @param {PageFlip} app - PageFlip instanse
     * @param {FlipSetting} setting - Configuration object
     */
    protected constructor(inBlock: HTMLElement, app: PageFlip, setting: FlipSetting) {
        this.parentElement = inBlock;

        inBlock.classList.add('stf__parent');
        // Add first wrapper
        inBlock.insertAdjacentHTML('afterbegin', '<div class="stf__wrapper"></div>');

        this.wrapper = inBlock.querySelector('.stf__wrapper');

        this.app = app;

        const k = (this.app.getSettings().usePortrait || this.app.getSettings().singlePage) ? 1 : 2;

        // Setting block sizes based on configuration
        inBlock.style.minWidth = setting.minWidth * k + 'px';
        inBlock.style.minHeight = setting.minHeight + 'px';

        if (setting.size === SizeType.FIXED) {
            inBlock.style.minWidth = setting.width * k + 'px';
            inBlock.style.minHeight = setting.height + 'px';
        }

        if (setting.autoSize) {
            inBlock.style.width = '100%';
            const maxK = this.app.getSettings().singlePage ? 1 : 2;
            inBlock.style.maxWidth = setting.maxWidth * maxK + 'px';
        }

        inBlock.style.display = 'block';

        window.addEventListener('resize', this.onResize, false);
        this.swipeDistance = setting.swipeDistance;
    }

    /**
     * Destructor. Remove all HTML elements and all event handlers
     */
    public destroy(): void {
        if (this.app.getSettings().useMouseEvents) this.removeHandlers();

        this.distElement.remove();
        this.wrapper.remove();
    }

    /**
     * Updating child components when resizing
     */
    public abstract update(): void;

    /**
     * Get parent element for book
     *
     * @returns {HTMLElement}
     */
    public getDistElement(): HTMLElement {
        return this.distElement;
    }

    /**
     * Get wrapper element
     *
     * @returns {HTMLElement}
     */
    public getWrapper(): HTMLElement {
        return this.wrapper;
    }

    /**
     * Updates styles and sizes based on book orientation
     *
     * @param {Orientation} orientation - New book orientation
     */
    public setOrientationStyle(orientation: Orientation): void {
        this.wrapper.classList.remove('--portrait', '--landscape');

        if (orientation === Orientation.PORTRAIT) {
            if (this.app.getSettings().autoSize)
                this.wrapper.style.paddingBottom =
                    (this.app.getSettings().height / this.app.getSettings().width) * 100 + '%';

            this.wrapper.classList.add('--portrait');
        } else {
            if (this.app.getSettings().autoSize)
                this.wrapper.style.paddingBottom =
                    (this.app.getSettings().height / (this.app.getSettings().width * 2)) * 100 +
                    '%';

            this.wrapper.classList.add('--landscape');
        }

        this.update();
    }

    protected removeHandlers(): void {
        window.removeEventListener('resize', this.onResize);

        this.distElement.removeEventListener('mousedown', this.onMouseDown);
        this.distElement.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('touchend', this.onTouchEnd);
    }

    protected setHandlers(): void {
        window.addEventListener('resize', this.onResize, false);
        if (!this.app.getSettings().useMouseEvents) return;

        this.distElement.addEventListener('mousedown', this.onMouseDown);
        this.distElement.addEventListener('touchstart', this.onTouchStart);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('touchmove', this.onTouchMove, {
            passive: !this.app.getSettings().mobileScrollSupport,
        });
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('touchend', this.onTouchEnd);
    }

    /**
     * Convert global coordinates to relative book coordinates
     *
     * @param x
     * @param y
     */
    private getMousePos(x: number, y: number): Point {
        const rect = this.distElement.getBoundingClientRect();

        return {
            x: x - rect.left,
            y: y - rect.top,
        };
    }

    private checkTarget(targer: EventTarget): boolean {
        if (!this.app.getSettings().clickEventForward) return true;

        if (['a', 'button'].includes((targer as HTMLElement).tagName.toLowerCase())) {
            return false;
        }

        return true;
    }

    private onMouseDown = (e: MouseEvent): void => {
        if (this.checkTarget(e.target)) {
            const pos = this.getMousePos(e.clientX, e.clientY);

            this.app.startUserTouch(pos);

            e.preventDefault();
        }
    };

    private onTouchStart = (e: TouchEvent): void => {
        if (this.checkTarget(e.target)) {
            if (e.changedTouches.length > 0) {
                const t = e.changedTouches[0];
                const pos = this.getMousePos(t.clientX, t.clientY);

                this.touchPoint = {
                    point: pos,
                    time: Date.now(),
                };
                this.swipeDetected = false;

                // 单页模式下不启动拖角（拖角是翻书动画，移动端无用且会干扰滑动检测）
                if (!this.app.getSettings().singlePage) {
                    setTimeout(() => {
                        if (this.touchPoint !== null && !this.swipeDetected) {
                            this.app.startUserTouch(pos);
                        }
                    }, this.swipeTimeout);
                }

                if (!this.app.getSettings().mobileScrollSupport) e.preventDefault();
            }
        }
    };

    private onMouseUp = (e: MouseEvent): void => {
        const pos = this.getMousePos(e.clientX, e.clientY);

        this.app.userStop(pos);
    };

    private onMouseMove = (e: MouseEvent): void => {
        const pos = this.getMousePos(e.clientX, e.clientY);

        this.app.userMove(pos, false);
    };

    private onTouchMove = (e: TouchEvent): void => {
        if (e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            const pos = this.getMousePos(t.clientX, t.clientY);

            // ---- 早期滑动检测：在 touchMove 中识别方向，不等 touchEnd ----
            // 好处：手指移动 swipeDistance 像素即触发翻页，比等手指抬起快 100-200ms
            // flipNext/flipPrev 内部会自动打断当前动画（finishAnimation），支持快速连翻
            if (this.touchPoint !== null && !this.swipeDetected) {
                const dx = pos.x - this.touchPoint.point.x;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(pos.y - this.touchPoint.point.y);

                if (absDx >= this.swipeDistance && absDx > absDy * 1.2) {
                    this.swipeDetected = true;
                    if (e.cancelable) e.preventDefault();

                    const corner =
                        this.touchPoint.point.y < this.app.getRender().getRect().height / 2
                            ? FlipCorner.TOP
                            : FlipCorner.BOTTOM;

                    if (dx > 0) {
                        this.app.flipPrev(corner);
                    } else {
                        this.app.flipNext(corner);
                    }

                    this.touchPoint = null;
                    return;
                }
            }

            // 滑动已处理，后续 touchMove 只阻止滚动
            if (this.swipeDetected) {
                if (e.cancelable) e.preventDefault();
                return;
            }

            // 非滑动场景（桌面端拖角翻页等）保持原有逻辑
            if (this.app.getSettings().mobileScrollSupport) {
                if (this.touchPoint !== null) {
                    if (
                        Math.abs(this.touchPoint.point.x - pos.x) > 10 ||
                        this.app.getState() !== FlippingState.READ
                    ) {
                        if (e.cancelable) this.app.userMove(pos, true);
                    }
                }

                if (this.app.getState() !== FlippingState.READ) {
                    e.preventDefault();
                }
            } else {
                this.app.userMove(pos, true);
            }
        }
    };

    private onTouchEnd = (e: TouchEvent): void => {
        if (e.changedTouches.length > 0) {
            const t = e.changedTouches[0];
            const pos = this.getMousePos(t.clientX, t.clientY);

            // 滑动已在 touchMove 中处理，直接结束
            if (this.swipeDetected) {
                this.swipeDetected = false;
                this.app.userStop(pos, true);
                return;
            }

            let isSwipe = false;

            if (this.touchPoint !== null) {
                const dx = pos.x - this.touchPoint.point.x;
                const absDx = Math.abs(dx);
                const distY = Math.abs(pos.y - this.touchPoint.point.y);
                const dt = Date.now() - this.touchPoint.time;

                // 后备滑动检测（极快的滑动可能在 touchMove 中未达到阈值）
                if (
                    absDx > this.swipeDistance &&
                    distY < this.swipeDistance * 2 &&
                    dt < this.swipeTimeout
                ) {
                    const corner =
                        this.touchPoint.point.y < this.app.getRender().getRect().height / 2
                            ? FlipCorner.TOP
                            : FlipCorner.BOTTOM;

                    if (dx > 0) {
                        this.app.flipPrev(corner);
                    } else {
                        this.app.flipNext(corner);
                    }
                    isSwipe = true;
                }

                // ---- 单页模式点击翻页（移动端） ----
                // 左 25%: 上一页 | 右 25%: 下一页 | 中间 50%: 不处理（事件冒泡到父组件切换工具栏）
                if (!isSwipe && this.app.getSettings().singlePage && absDx < 15 && distY < 15 && dt < 400) {
                    const rect = this.app.getRender().getRect();
                    const pageWidth = rect.pageWidth;

                    if (pos.x < pageWidth * 0.25) {
                        this.app.flipPrev(FlipCorner.BOTTOM);
                        isSwipe = true;
                    } else if (pos.x > pageWidth * 0.75) {
                        this.app.flipNext(FlipCorner.BOTTOM);
                        isSwipe = true;
                    }
                    // 中间区域：isSwipe 保持 false，事件自然传播
                }

                this.touchPoint = null;
            }

            this.app.userStop(pos, isSwipe);
        }
    };
}
