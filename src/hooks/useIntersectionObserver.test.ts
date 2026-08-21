import { renderHook, act } from '@testing-library/react';
import { useIntersectionObserver } from './useIntersectionObserver';

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    callback: IntersectionObserverCallback;
    elements: Set<Element>;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.callback = callback;
        this.elements = new Set();
        if (options) {
            this.root = options.root ?? null;
            this.rootMargin = options.rootMargin ?? '';
            this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold ?? 0];
        }
    }

    observe(element: Element): void {
        this.elements.add(element);
    }

    unobserve(element: Element): void {
        this.elements.delete(element);
    }

    disconnect(): void {
        this.elements.clear();
    }

    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
}

describe('useIntersectionObserver', () => {
    let originalIntersectionObserver: any;

    beforeAll(() => {
        originalIntersectionObserver = window.IntersectionObserver;
        window.IntersectionObserver = MockIntersectionObserver;
    });

    afterAll(() => {
        window.IntersectionObserver = originalIntersectionObserver;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns undefined initially when node is null', () => {
        const ref = { current: null };
        const { result } = renderHook(() => useIntersectionObserver(ref, {}));

        expect(result.current).toBeUndefined();
    });

    it('does not observe if IntersectionObserver is not supported', () => {
        const tempObserver = window.IntersectionObserver;
        delete (window as any).IntersectionObserver;

        const mockElement = document.createElement('div');
        const ref = { current: mockElement };

        const { result } = renderHook(() => useIntersectionObserver(ref, {}));

        expect(result.current).toBeUndefined();

        // Restore
        window.IntersectionObserver = tempObserver;
    });

    it('initializes observer and observes the element', () => {
        const mockElement = document.createElement('div');
        const ref = { current: mockElement };

        const observeSpy = jest.spyOn(MockIntersectionObserver.prototype, 'observe');

        renderHook(() => useIntersectionObserver(ref, { threshold: 0.5 }));

        expect(observeSpy).toHaveBeenCalledWith(mockElement);
    });

    it('updates state when intersection event occurs', () => {
        const mockElement = document.createElement('div');
        const ref = { current: mockElement };

        let observerInstance: MockIntersectionObserver | undefined;

        // Wrap constructor to get instance
        const OriginalMock = window.IntersectionObserver;
        window.IntersectionObserver = jest.fn().mockImplementation((cb, opts) => {
            observerInstance = new OriginalMock(cb, opts);
            return observerInstance;
        });

        const { result } = renderHook(() => useIntersectionObserver(ref, {}));

        expect(result.current).toBeUndefined();

        // Simulate intersection event
        const mockEntry = {
            isIntersecting: true,
            intersectionRatio: 1,
            target: mockElement,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: Date.now()
        };

        act(() => {
            if (observerInstance) {
                observerInstance.callback([mockEntry], observerInstance);
            }
        });

        expect(result.current).toEqual(mockEntry);

        // Restore
        window.IntersectionObserver = OriginalMock;
    });

    it('disconnects on unmount', () => {
        const mockElement = document.createElement('div');
        const ref = { current: mockElement };

        const disconnectSpy = jest.spyOn(MockIntersectionObserver.prototype, 'disconnect');

        const { unmount } = renderHook(() => useIntersectionObserver(ref, {}));

        unmount();

        expect(disconnectSpy).toHaveBeenCalled();
    });

    it('freezes state and stops observing when freezeOnceVisible is true', () => {
        const mockElement = document.createElement('div');
        const ref = { current: mockElement };

        let observerInstance: MockIntersectionObserver | undefined;

        const OriginalMock = window.IntersectionObserver;
        const mockConstructor = jest.fn().mockImplementation((cb, opts) => {
            observerInstance = new OriginalMock(cb, opts);
            jest.spyOn(observerInstance, 'disconnect');
            return observerInstance;
        });
        window.IntersectionObserver = mockConstructor;

        const { result, rerender } = renderHook(() => useIntersectionObserver(ref, { freezeOnceVisible: true }));

        const mockEntry = {
            isIntersecting: true,
            intersectionRatio: 1,
            target: mockElement,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: Date.now()
        };

        // Trigger intersection
        act(() => {
            if (observerInstance) {
                observerInstance.callback([mockEntry], observerInstance);
            }
        });

        expect(result.current).toEqual(mockEntry);

        rerender();

        // Verify it stops observing / disconnects upon freezing
        // Effect hook dependency array has `frozen`, so it re-runs when frozen becomes true.
        // It returns early `if (frozen) return`, and cleans up the previous observer by calling `disconnect`.
        expect(observerInstance?.disconnect).toHaveBeenCalled();

        // If it returns early, constructor is not called again
        expect(mockConstructor).toHaveBeenCalledTimes(1);

        window.IntersectionObserver = OriginalMock;
    });
});
