import AppLayout from "@/components/layout/AppLayout";

export default function Home() {
  return (
    <AppLayout>
      <main className="flex flex-col gap-[32px] items-center sm:items-start">
        <p>Welcome!</p>
      </main>
    </AppLayout>
  );
}
