[![GitHub license](https://img.shields.io/github/license/marvellousPtc/react-pageflip)](https://github.com/marvellousPtc/react-pageflip/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/@marvellousptc/react-pageflip)](https://www.npmjs.com/package/@marvellousptc/react-pageflip)

# @marvellousptc/react-pageflip

Enhanced React.js page flip component based on [StPageFlip](https://github.com/Nodlik/StPageFlip), with **single-page mode** and improved touch/swipe support.

> Forked from [Nodlik/react-pageflip](https://github.com/Nodlik/react-pageflip), with the [page-flip](https://github.com/Nodlik/StPageFlip) core vendored and modified.

![](video.gif)

### What's New (compared to the original)

- **`singlePage` mode**: Force single-page display with flip animation, independent of container width. Ideal for mobile reading.
- **Fixed portrait back-flip animation**: Back-flip in portrait/single-page mode now correctly peels from the left side, matching the landscape left-page flip effect.
- **Fixed `disableFlipByClick` blocking swipe**: `disableFlipByClick` now only blocks click-to-flip; swipe gestures and programmatic `flipPrev`/`flipNext` calls are no longer affected.
- **Vendored page-flip core**: The `page-flip` library source is included directly, no external dependency needed.

### Features

- Works with simple images on canvas and complex HTML blocks
- Has simple API and flexible configuration
- Compatible with mobile devices
- Supports landscape and portrait screen mode
- Supports single-page mode with full flip animation
- Supports soft and hard page types (only in HTML mode)
- No external dependencies

### Installation

```bash
npm install @marvellousptc/react-pageflip
```

### Basic Usage

```jsx
import HTMLFlipBook from '@marvellousptc/react-pageflip';

function MyBook(props) {
    return (
        <HTMLFlipBook width={300} height={500}>
            <div className="demoPage">Page 1</div>
            <div className="demoPage">Page 2</div>
            <div className="demoPage">Page 3</div>
            <div className="demoPage">Page 4</div>
        </HTMLFlipBook>
    );
}
```

### Single Page Mode (for mobile)

```jsx
import HTMLFlipBook from '@marvellousptc/react-pageflip';

function MyBook() {
    const isMobile = window.innerWidth <= 768;

    return (
        <HTMLFlipBook
            width={300}
            height={500}
            size="stretch"
            minWidth={300}
            maxWidth={500}
            minHeight={400}
            maxHeight={700}
            singlePage={isMobile}
            usePortrait={false}
        >
            <div className="demoPage">Page 1</div>
            <div className="demoPage">Page 2</div>
            <div className="demoPage">Page 3</div>
            <div className="demoPage">Page 4</div>
        </HTMLFlipBook>
    );
}
```

### Advanced Usage

You can define pages as a component, but in this case you should use `React.forwardRef` method:

```jsx
const Page = React.forwardRef((props, ref) => {
    return (
        <div className="demoPage" ref={ref}>
            <h1>Page Header</h1>
            <p>{props.children}</p>
            <p>Page number: {props.number}</p>
        </div>
    );
});

function MyBook(props) {
    return (
        <HTMLFlipBook width={300} height={500}>
            <Page number="1">Page text</Page>
            <Page number="2">Page text</Page>
            <Page number="3">Page text</Page>
            <Page number="4">Page text</Page>
        </HTMLFlipBook>
    );
}
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number` | **required** | Page width |
| `height` | `number` | **required** | Page height |
| `size` | `"fixed" \| "stretch"` | `"fixed"` | Whether the book stretches to fill parent |
| `minWidth, maxWidth, minHeight, maxHeight` | `number` | — | Threshold values for `size: "stretch"` |
| `drawShadow` | `boolean` | `true` | Draw shadows when flipping |
| `flippingTime` | `number` (ms) | `1000` | Flipping animation duration |
| `usePortrait` | `boolean` | `true` | Enable auto-switching to portrait mode |
| `singlePage` | `boolean` | `false` | **NEW** Force single-page display with flip animation |
| `startZIndex` | `number` | `0` | Initial z-index value |
| `autoSize` | `boolean` | `true` | Parent element auto-sizes to book |
| `maxShadowOpacity` | `number [0..1]` | `1` | Shadow intensity |
| `showCover` | `boolean` | `false` | First and last pages as hard covers |
| `mobileScrollSupport` | `boolean` | `true` | Disable content scrolling on touch |
| `swipeDistance` | `number` (px) | `30` | Minimum swipe distance to detect |
| `clickEventForward` | `boolean` | `true` | Forward click events to `a` and `button` children |
| `useMouseEvents` | `boolean` | `true` | Enable mouse and touch events |
| `disableFlipByClick` | `boolean` | `false` | Disable page flip on click (swipe still works) |
| `renderOnlyPageLengthChange` | `boolean` | `false` | Only re-render when page count changes |

### Events

```jsx
function DemoBook() {
    const onFlip = useCallback((e) => {
        console.log('Current page: ' + e.data);
    }, []);

    return (
        <HTMLFlipBook onFlip={onFlip}>
            {/* ... pages */}
        </HTMLFlipBook>
    );
}
```

**Available events:**

- `onFlip: number` - triggered by page turning
- `onChangeOrientation: ("portrait", "landscape")` - triggered when orientation changes
- `onChangeState: ("user_fold", "fold_corner", "flipping", "read")` - triggered when book state changes
- `onInit: ({page, mode})` - triggered when book is initialized
- `onUpdate: ({page, mode})` - triggered when book pages are updated

Event object has two fields: `data: number | string` and `object: PageFlip`

### Methods

Use React `ref` and `pageFlip()` to access methods:

```jsx
function DemoBook() {
    const book = useRef();

    return (
        <>
            <button onClick={() => book.current.pageFlip().flipNext()}>
                Next page
            </button>
            <HTMLFlipBook ref={book}>
                {/* ... pages */}
            </HTMLFlipBook>
        </>
    );
}
```

| Method | Parameters | Return | Description |
| --- | --- | --- | --- |
| `getPageCount` | | `number` | Get total page count |
| `getCurrentPageIndex` | | `number` | Get current page index (0-based) |
| `getOrientation` | | `string` | Get orientation: portrait or landscape |
| `getBoundsRect` | | `PageRect` | Get book size and position |
| `turnToPage` | `pageNum: number` | `void` | Go to page (no animation) |
| `turnToNextPage` | | `void` | Next page (no animation) |
| `turnToPrevPage` | | `void` | Previous page (no animation) |
| `flipNext` | `corner: 'top' \| 'bottom'` | `void` | Next page (with animation) |
| `flipPrev` | `corner: 'top' \| 'bottom'` | `void` | Previous page (with animation) |
| `flip` | `pageNum, corner` | `void` | Go to page (with animation) |
| `loadFromImages` | `images: string[]` | `void` | Load pages from images |
| `loadFromHtml` | `items: HTMLElement[]` | `void` | Load pages from HTML elements |
| `updateFromHtml` | `items: HTMLElement[]` | `void` | Update pages from HTML elements |
| `updateFromImages` | `images: string[]` | `void` | Update pages from images |
| `destroy` | | `void` | Remove element and event handlers |

### Credits

Based on [react-pageflip](https://github.com/Nodlik/react-pageflip) by [Nodlik](https://github.com/Nodlik) and [StPageFlip](https://github.com/Nodlik/StPageFlip). Licensed under MIT.

### License

[MIT](LICENSE)
