import React, {
    ReactElement,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

import { PageFlip } from '../page-flip/PageFlip';
import { IFlipSetting, IEventProps } from './settings';

interface IProps extends IFlipSetting, IEventProps {
    className: string;
    style: React.CSSProperties;
    children: React.ReactNode;
    renderOnlyPageLengthChange?: boolean;
}

const HTMLFlipBookForward = React.forwardRef(
    (props: IProps, ref: React.MutableRefObject<PageFlip>) => {
        const htmlElementRef = useRef<HTMLDivElement>(null);
        const childRef = useRef<HTMLElement[]>([]);
        const pageFlip = useRef<PageFlip>();

        const [pages, setPages] = useState<ReactElement[]>([]);

        // ---- Ref-bridge for event handlers ----
        // Handlers are registered ONCE (during first loadFromHTML) using stable
        // arrow functions that read from refs. This eliminates stale closures:
        // even if the parent re-renders with new callback references, the
        // registered handler always calls the latest function.
        const onFlipRef = useRef(props.onFlip);
        const onChangeOrientationRef = useRef(props.onChangeOrientation);
        const onChangeStateRef = useRef(props.onChangeState);
        const onInitRef = useRef(props.onInit);
        const onUpdateRef = useRef(props.onUpdate);

        // Keep refs in sync — no dependency array means this runs every render
        useEffect(() => {
            onFlipRef.current = props.onFlip;
            onChangeOrientationRef.current = props.onChangeOrientation;
            onChangeStateRef.current = props.onChangeState;
            onInitRef.current = props.onInit;
            onUpdateRef.current = props.onUpdate;
        });

        useImperativeHandle(ref, () => ({
            pageFlip: () => pageFlip.current,
        }));

        const refreshOnPageDelete = useCallback(() => {
            if (pageFlip.current) {
                pageFlip.current.clear();
            }
        }, []);

        // ---- Children → pages state ----
        useEffect(() => {
            childRef.current = [];

            if (props.children) {
                const childList = React.Children.map(props.children, (child) => {
                    return React.cloneElement(child as ReactElement, {
                        ref: (dom) => {
                            if (dom) {
                                childRef.current.push(dom);
                            }
                        },
                    });
                });

                if (!props.renderOnlyPageLengthChange || pages.length !== childList.length) {
                    if (childList.length < pages.length) {
                        refreshOnPageDelete();
                    }

                    setPages(childList);
                }
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [props.children]);

        // ---- Initialize / update PageFlip when pages change ----
        useEffect(() => {
            if (pages.length > 0 && childRef.current.length > 0) {
                if (htmlElementRef.current && !pageFlip.current) {
                    pageFlip.current = new PageFlip(htmlElementRef.current, props);
                }

                if (!pageFlip.current.getFlipController()) {
                    // First time: register handlers via ref-bridge (stable, never stale)
                    const flip = pageFlip.current;

                    flip.on('flip', (e: unknown) => onFlipRef.current?.(e));
                    flip.on('changeOrientation', (e: unknown) =>
                        onChangeOrientationRef.current?.(e)
                    );
                    flip.on('changeState', (e: unknown) => onChangeStateRef.current?.(e));
                    flip.on('init', (e: unknown) => onInitRef.current?.(e));
                    flip.on('update', (e: unknown) => onUpdateRef.current?.(e));

                    flip.loadFromHTML(childRef.current);
                } else {
                    // Subsequent update: pass startPage as target page so the
                    // library navigates to the correct page in the new children set.
                    // This allows sliding-window updates WITHOUT changing `key`.
                    pageFlip.current.updateFromHtml(childRef.current, props.startPage);
                }
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [pages]);

        // ---- React to startPage prop changes (navigate without children change) ----
        const prevStartPageRef = useRef(props.startPage);
        useEffect(() => {
            if (
                pageFlip.current &&
                pageFlip.current.getFlipController() &&
                props.startPage !== prevStartPageRef.current
            ) {
                prevStartPageRef.current = props.startPage;
                pageFlip.current.turnToPage(props.startPage);
            }
        }, [props.startPage]);

        // ---- Cleanup on unmount ----
        useEffect(() => {
            return () => {
                if (pageFlip.current) {
                    // Stop the rAF loop to prevent accessing destroyed pages
                    try {
                        pageFlip.current.getRender()?.stop();
                    } catch {
                        // render may not exist if init failed
                    }
                    pageFlip.current = undefined;
                }
            };
        }, []);

        return (
            <div ref={htmlElementRef} className={props.className} style={props.style}>
                {pages}
            </div>
        );
    }
);

export const HTMLFlipBook = React.memo(HTMLFlipBookForward);
