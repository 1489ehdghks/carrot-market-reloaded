export default function Loading() {
    return (
      <div className="fixed inset-0 bg-black/40 p-6 flex items-center justify-center">
        <div className="bg-neutral-800 rounded-md p-6">
          <p>로딩중...</p>
        </div>
      </div>
    );
  }