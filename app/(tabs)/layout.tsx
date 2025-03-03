import MainLayout from "@/components/layout/main-layout";
import TabBar from "@/components/tab-bar";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout>
      <div className="pb-20 md:pb-0">
        {children}
      </div>
      {/* <TabBar /> */}
    </MainLayout>
  );
}