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
        const onFlipRef = useRef(props.onFlip);
        const onChangeOrientationRef = useRef(props.onChangeOrientation);
        const onChangeStateRef = useRef(props.onChangeState);
        const onInitRef = useRef(props.onInit);
        const onUpdateRef = useRef(props.onUpdate);

        useEffect(() => {
            onFlipRef.current = props.onFlip;
            onChangeOrientationRef.current = props.onChangeOrientation;
            onChangeStateRef.current = props.onChangeState;
            onInitRef.current = props.onInit;
            onUpdateRef.current = props.onUpdate;
        });

        // ---- Patch removeChild on root element ----
        // PageFlip moves React-managed DOM elements from the root div into its
        // own internal container (stf__block) via appendChild. When React later
        // reconciles and tries to remove old children, it calls
        // rootDiv.removeChild(movedElement) which fails because the element's
        // parentNode is now stf__block, not rootDiv.
        //
        // This patch gracefully handles moved elements: if the child is not a
        // direct child of rootDiv, remove it from its actual parent instead.
        const patchedRef = useRef(false);
        useEffect(() => {
            const el = htmlElementRef.current;
            if (!el || patchedRef.current) return;
            patchedRef.current = true;

            const origRemoveChild = el.removeChild.bind(el);
            el.removeChild = function <T extends Node>(child: T): T {
                if ((child as Node).parentNode === el) {
                    return origRemoveChild(child);
                }
                // Element was moved by PageFlip — remove from actual parent
                try {
                    (child as Node).parentNode?.removeChild(child);
                } catch {
                    // Already removed or detached — safe to ignore
                }
                return child;
            };
        }, []);

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
