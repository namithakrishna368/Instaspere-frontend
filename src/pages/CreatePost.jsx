import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Image, X, ArrowLeft } from "lucide-react";
import API from "../api/axios";
import Sidebar from "../components/Sidebar";

export default function CreatePost() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [caption, setCaption] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Select, 2: Details

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setImages(files);
            const newPreviews = files.map((file) => URL.createObjectURL(file));
            setPreviews(newPreviews);
            setStep(2);
        }
    };

    const clearSelection = () => {
        setImages([]);
        setPreviews([]);
        setStep(1);
    };

    const handleShare = async () => {
        if (images.length === 0) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("caption", caption);
            images.forEach((image) => {
                formData.append("images", image);
            });

            await API.post("/posts/create", formData);
            navigate("/profile");
        } catch (error) {
            console.error(error);
            alert("Failed to create post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-white min-h-screen font-sans">
            <Sidebar />

            {/* Main Content - No Overlay on Mobile */}
            <div className="flex-1 md:ml-72 mb-16 md:mb-0 bg-white flex items-center justify-center p-0 md:p-4">

                <div className="bg-white w-full h-full md:h-[600px] md:max-w-[800px] md:rounded-xl md:border md:shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="h-12 border-b flex items-center justify-between px-4 bg-white z-10">
                        {step === 1 ? (
                            <h1 className="text-base font-bold flex-1 text-center">Create new post</h1>
                        ) : (
                            <>
                                <button onClick={() => setStep(1)} className="p-1 hover:bg-gray-100 rounded-full">
                                    <ArrowLeft size={24} />
                                </button>
                                <h1 className="text-base font-bold text-center">New post</h1>
                                <button
                                    onClick={handleShare}
                                    disabled={loading}
                                    className="text-[#0095F6] font-bold text-sm hover:text-[#00376b] disabled:opacity-50"
                                >
                                    {loading ? "Sharing..." : "Share"}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex bg-white h-full overflow-hidden">

                        {step === 1 ? (
                            <div className="flex-1 flex flex-col justify-center items-center p-8 gap-6 text-center">
                                <Image size={80} className="text-black dark:text-gray-200" strokeWidth={1} />
                                <h3 className="text-2xl font-light">Drag photos and videos here</h3>
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="bg-[#0095F6] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#1877F2] transition-colors"
                                >
                                    Select from computer
                                </button>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row w-full h-full">
                                {/* Image Preview Side */}
                                <div className="flex-1 md:w-[60%] bg-black flex items-center justify-center relative bg-gray-100">
                                    {previews.length > 0 && (
                                        <img
                                            src={previews[0]}
                                            className="max-w-full max-h-full object-contain"
                                            alt="Preview"
                                        />
                                    )}
                                    {previews.length > 1 && (
                                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded-md text-xs">
                                            + {previews.length - 1} more
                                        </div>
                                    )}
                                </div>

                                {/* Details Side */}
                                <div className="w-full md:w-[40%] bg-white border-l flex flex-col">
                                    {/* User Info (Mock for now, or fetch context if available) */}
                                    <div className="p-4 flex items-center gap-3">
                                        <div className="w-7 h-7 bg-gray-200 rounded-full" />
                                        <span className="font-semibold text-sm">You</span>
                                    </div>

                                    <div className="px-4 flex-1">
                                        <textarea
                                            value={caption}
                                            onChange={(e) => setCaption(e.target.value)}
                                            placeholder="Write a caption..."
                                            className="w-full h-40 resize-none text-sm focus:outline-none"
                                            maxLength="2200"
                                        />
                                        <div className="text-right text-gray-300 text-xs">
                                            {caption.length}/2,200
                                        </div>
                                    </div>

                                    <div className="border-t p-3">
                                        <div className="flex justify-between items-center py-2 cursor-pointer">
                                            <span className="text-gray-700">Add Location</span>
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                        <div className="flex justify-between items-center py-2 cursor-pointer border-t">
                                            <span className="text-gray-700">Accessibility</span>
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                        <div className="flex justify-between items-center py-2 cursor-pointer border-t">
                                            <span className="text-gray-700">Advanced settings</span>
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
