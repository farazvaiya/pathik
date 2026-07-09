export default function ComingSoonCard({ region }) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-amber-200 text-center">
      <div className="text-4xl mb-3">🚧</div>
      <h2 className="text-lg font-bold text-slate-800 mb-2">
        পথিক শীঘ্রই আসছে!
      </h2>
      <p className="text-sm text-slate-600 mb-4">
        আমরা বর্তমানে শুধুমাত্র <b>ঢাকা বিভাগ</b>-এর জন্য রুট তথ্য সংগ্রহ করেছি।
        {region && (
          <span className="block mt-1">
            <b>{region}</b>-এর জন্য এখনও ডাটা সংগ্রহ করা হয়নি।
          </span>
        )}
      </p>
      <div className="bg-white rounded-xl p-4 border border-amber-100">
        <div className="text-2xl mb-2">🤝</div>
        <p className="text-sm font-semibold text-slate-700 mb-1">
          আপনি কি সাহায্য করতে পারেন?
        </p>
        <p className="text-xs text-slate-500">
          আপনার এলাকার বাস রুট, স্টপেজ ও ভাড়ার তথ্য আমাদের জানান।
        </p>
      </div>
    </div>
  );
}
