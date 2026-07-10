function HeroMobile() {
  return (
    <div className="lg:hidden">
      <h1 className="text-center font-heading text-4xl font-extrabold leading-[0.95] tracking-tight text-[#1c4a25] sm:text-5xl">
        Everything
        <br />
        Your Pets Love
      </h1>
    </div>
  );
}

function HeroDesktop() {
  return (
    <div className="relative hidden lg:block">
      <h1 className="text-center font-heading text-[6.5rem] font-extrabold leading-[0.9] tracking-tight text-[#1c4a25] xl:text-[8rem]">
        Everything
        <br />
        Your Pets Love
      </h1>
    </div>
  );
}

export function Hero() {
  return (
    <section className="bg-[#14421e] p-3 sm:p-4 lg:p-6">
      <div className="overflow-hidden rounded-[2.5rem] bg-[#e9f6e1] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <HeroMobile />
        <HeroDesktop />
      </div>
    </section>
  );
}
