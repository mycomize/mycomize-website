import { Header } from "./Header";
import { Footer } from "./Footer";

const posts = [
    {
        id: 1,
        title: "Microdosing Psilocybin Mushrooms",
        href: "/blog/microdosing",
        description:
            "Curious about microdosing? This post walks you through the basics of microdosing for health and wellness.",
        date: "April 1, 2025",
        datetime: "2025-04-1",
        category: { title: "Psychedelics", href: "#" },
        author: {
            name: "Connor Davis",
            role: "",
            href: "https://x.com/cjamsonx",
            imageUrl: "/selfie.jpg",
        },
    },
    // More posts...
];

export function Blog() {
    return (
        <div id="blog_container" className="min-h-screen flex flex-col">
            <Header />
            <MycomizeBlog />
            <Footer />
        </div>
    );
}

function MycomizeBlog() {
    return (
        <div
            id="blog_page"
            className="bg-white px-6 py-10 sm:py-20 lg:px-8 flex-grow"
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl">
                    <p className="text-base/7 font-raleway font-semibold text-blue-600">
                        Learn
                    </p>
                    <h1 className="mt-2 text-pretty text-4xl font-raleway font-semibold tracking-tight text-gray-900 sm:text-5xl">
                        Blog
                    </h1>
                    <p className="mt-4 text-xl/8 text-gray-600">
                        Learn about the latest in mushroom cultivation and
                        psychedelic science
                    </p>
                    <div className="mt-4 space-y-8 border-t border-gray-400 pt-4 sm:mt-8 sm:pt-8">
                        {posts.map((post) => (
                            <article
                                key={post.id}
                                className="flex max-w-xl flex-col items-start justify-between"
                            >
                                <div className="flex items-center gap-x-4 text-md">
                                    <time
                                        dateTime={post.datetime}
                                        className="text-gray-500"
                                    >
                                        {post.date}
                                    </time>
                                    <a
                                        href={post.category.href}
                                        className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                                    >
                                        {post.category.title}
                                    </a>
                                </div>
                                <div className="group relative">
                                    <h3 className="mt-3 text-xl/6 font-semibold text-gray-900 group-hover:text-gray-600">
                                        <a href={post.href}>
                                            <span className="absolute inset-0" />
                                            {post.title}
                                        </a>
                                    </h3>
                                    <p className="mt-5 line-clamp-3 text-lg/6 text-gray-600">
                                        {post.description}
                                    </p>
                                </div>
                                <div className="relative mt-8 flex items-center gap-x-4">
                                    <img
                                        alt=""
                                        src={post.author.imageUrl}
                                        className="circle object-cover w-12 h-12 sm:w-14 sm:h-14 bg-gray-50"
                                    />
                                    <div className="text-sm/6">
                                        <p className="text-lg font-semibold text-gray-900">
                                            <a href={post.author.href}>
                                                <span className="absolute inset-0" />
                                                {post.author.name}
                                            </a>
                                        </p>
                                        <p className="text-gray-600">
                                            {post.author.role}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
