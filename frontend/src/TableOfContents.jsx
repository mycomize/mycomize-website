import { useState, useEffect, useRef } from "react";

/**
 * TableOfContents - A component that generates a floating table of contents
 * from header elements (h1-h6) on the page.
 *
 * @param {Object} props
 * @param {string} props.contentSelector - CSS selector for the content container (default: '.content')
 * @param {string} props.headingSelector - CSS selector for headings (default: 'h1, h2, h3, h4, h5, h6')
 * @param {number} props.offset - Offset from the top of the viewport (default: 70)
 * @param {boolean} props.smooth - Enable smooth scrolling (default: true)
 */
const TableOfContents = ({
    contentSelector = ".content",
    headingSelector = "h1, h2, h3, h4, h5, h6",
    offset = 70,
    smooth = true,
}) => {
    const [headings, setHeadings] = useState([]);
    const [activeId, setActiveId] = useState("");
    const tocRef = useRef(null);

    useEffect(() => {
        const contentElement = document.querySelector(contentSelector);

        if (!contentElement) {
            console.warn(
                `TableOfContents: No element found with selector "${contentSelector}"`
            );
            return;
        }

        // Find all heading elements
        const elements = Array.from(
            contentElement.querySelectorAll(headingSelector)
        );

        // Process heading elements
        const headingElements = elements.map((element) => {
            // Ensure headings have IDs for linking
            if (!element.id) {
                const id = element.textContent
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");
                element.id = id;
            }

            return {
                id: element.id,
                text: element.textContent,
                level: parseInt(element.tagName.substring(1)), // get heading level (1-6)
            };
        });

        setHeadings(headingElements);

        // Set up intersection observer to highlight active heading
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: `-${offset}px 0px -80% 0px`,
            }
        );

        // Observe all headings
        elements.forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, [contentSelector, headingSelector, offset]);

    const handleClick = (e, id) => {
        e.preventDefault();

        const element = document.getElementById(id);
        if (!element) return;

        const topPosition =
            element.getBoundingClientRect().top + window.scrollY - offset;

        if (smooth) {
            window.scrollTo({
                top: topPosition,
                behavior: "smooth",
            });
        } else {
            window.scrollTo(0, topPosition);
        }

        setActiveId(id);
    };

    if (headings.length === 0) {
        return null;
    }

    return (
        <div
            ref={tocRef}
            className="toc-container hidden 2xl:block fixed left-16 top-64 w-72 max-h-[70vh] overflow-y-auto p-6 bg-gray-100/95 rounded-lg shadow-md backdrop-blur-sm"
            style={{
                maxWidth: "280px",
                overflowY: "auto",
                borderRight: "1px solid #e5e7eb",
                zIndex: 10,
            }}
        >
            <h2 className="text-xl font-semibold mb-3">Table of Contents</h2>
            <nav>
                <ul className="space-y-1">
                    {headings.map((heading) => (
                        <li
                            key={heading.id}
                            className="toc-item"
                            style={{
                                paddingLeft: `${(heading.level - 1) * 0.5}rem`,
                                fontSize: `${Math.max(
                                    1.1 - (heading.level - 1) * 0.05,
                                    0.9
                                )}rem`,
                            }}
                        >
                            <a
                                href={`#${heading.id}`}
                                onClick={(e) => handleClick(e, heading.id)}
                                className={`block py-1 hover:text-blue-500 transition-colors ${
                                    activeId === heading.id
                                        ? "text-blue-600 font-medium"
                                        : "text-gray-700"
                                }`}
                            >
                                {heading.text}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default TableOfContents;
