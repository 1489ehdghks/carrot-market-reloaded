import MainLayout from "@/widgets/home/layout/main-layout";

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