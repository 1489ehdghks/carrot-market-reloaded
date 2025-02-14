import LeftSidebar from "./left-sidebar"
import RightSidebar from "./right-sidebar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <LeftSidebar />
      <main className="flex-1 pt-6 md:ml-5 lg:mr-5 min-h-screen w-full">
        <div className="max-w-screen-xl mx-auto">
          {children}
        </div>
      </main>
      <RightSidebar />
    </div>
  );
} 