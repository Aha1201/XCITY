export default function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition flex flex-col items-center">
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#f8f5ff] text-[#5e43d8] mb-6">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-600 text-center">{description}</p>
    </div>
  );
}
