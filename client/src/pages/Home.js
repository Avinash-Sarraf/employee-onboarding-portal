import { Link } from "react-router-dom";

const Home = () => {
  const features = [
    {
      title: "Employee dashboard",
      desc: "Track onboarding progress, training, and HR announcements.",
    },
    {
      title: "Secure documents",
      desc: "Upload and verify documents with a clear audit trail.",
    },
    {
      title: "Team workspace",
      desc: "Approvals, joining details, and messaging in one streamlined console.",
    },
  ];

  return (
    <>
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-12 pt-12 text-center sm:pb-16 sm:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
          Enterprise onboarding
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          One calm path from offer to day one.
        </h1>
        <p className="mt-6 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
          Registration, profiles, documents, training, and messaging—designed for clarity and
          consistency across teams.
        </p>
        <div className="mt-10">
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Get started
          </Link>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 pb-12 md:grid-cols-3">
        {features.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200/70 bg-white/60 p-6 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-950/60"
          >
            <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default Home;
