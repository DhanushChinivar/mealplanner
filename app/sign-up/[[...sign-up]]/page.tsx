import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f7fbf9]">
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20 py-12 sm:py-16 lg:py-20 flex justify-center items-start">
        <SignUp
          signInFallbackRedirectUrl="/create-profile"
          appearance={{
            elements: {
              card: "w-full max-w-[560px] shadow-xl border border-emerald-100 rounded-2xl",
              headerTitle: "text-3xl font-bold",
              headerSubtitle: "text-base",
              formButtonPrimary:
                "bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold",
              footerActionLink: "text-emerald-700 hover:text-emerald-800",
            },
          }}
        />
      </div>
    </div>
  );
}
