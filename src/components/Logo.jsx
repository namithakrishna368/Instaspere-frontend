import { Link } from "react-router-dom";

export default function Logo({ variant = "full", size = "normal" }) {
    // variant: "full" (icon + text + tagline), "icon" (icon only), "text" (icon + text)
    // size: "small", "normal", "large"

    const iconSize = size === "small" ? "w-8 h-8" : size === "large" ? "w-16 h-16" : "w-10 h-10";
    const textSize = size === "small" ? "text-xl" : size === "large" ? "text-4xl" : "text-2xl";
    const taglineSize = size === "small" ? "text-[8px]" : size === "large" ? "text-sm" : "text-[10px]";

    return (
        <Link to="/home" className="flex flex-col items-center select-none">
            <div className="flex items-center gap-2">
                {/* Icon with gradient */}
                <div className={`${iconSize} relative flex items-center justify-center`}>
                    {/* Using a placeholder SVG until image is ready, or use the generated image if available */}
                    <img
                        src="/logo_icon.png"
                        alt="Logo"
                        className="w-full h-full object-contain drop-shadow-md"
                        onError={(e) => {
                            // Fallback if image fails or not yet available
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                    <div className="hidden w-full h-full bg-gradient-to-tr from-[#ff00cc] to-[#333399] rounded-tr-2xl rounded-bl-2xl rounded-tl-lg rounded-br-lg rotate-12 shadow-lg"></div>
                </div>

                {variant !== "icon" && (
                    <h1 className={`font-logo font-bold ${textSize} bg-clip-text text-transparent bg-gradient-to-r from-[#ff00cc] to-[#333399] drop-shadow-sm`}>
                        InstaSpere
                    </h1>
                )}
            </div>

            {variant === "full" && (
                <span className={`font-tagline italic text-[#B026FF] neon-text-glow ${taglineSize} mt-1 tracking-wide`}>
                    Capture. Connect. Explore
                </span>
            )}
        </Link>
    );
}
