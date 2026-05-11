export default function PageHeader({ title, description, iconColor = "bg-[#1a5276]", className = "" }) {
    return (
        <div className={className}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-1.5 h-8 ${iconColor} rounded-full`} />
                <h1 className="text-3xl font-black text-[#102129] tracking-tight">
                    {title}
                </h1>
            </div>
            {description && (
                <p className="text-[16px] text-[#64748b] font-medium max-w-2xl leading-relaxed">
                    {description}
                </p>
            )}
        </div>
    );
}
