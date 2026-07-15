import {useId, useRef, useState} from 'react';

type InfoTab = 'description' | 'additional';

const PROSE =
  "text-[#347345] [&>h1]:font-heading [&>h1]:text-3xl [&>h1]:font-semibold [&>h1]:tracking-[-0.04em] [&>h1]:text-[#004817] [&>h2]:mt-8 [&>h2]:font-heading [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:tracking-[-0.04em] [&>h2]:text-[#004817] [&>h3]:mt-6 [&>h3]:font-heading [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-[#004817] [&>p]:text-lg [&>p]:leading-relaxed [&>p]:text-[#347345] [&>p+p]:mt-5 [&>ul]:mt-5 [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-3 [&_li]:relative [&_li]:mb-0 [&_li]:pl-7 [&_li]:text-base [&_li]:leading-relaxed [&_li]:text-[#347345] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.55em] [&_li]:before:size-2 [&_li]:before:rounded-full [&_li]:before:bg-[#00752d] [&_li]:before:content-[''] [&_a]:font-semibold [&_a]:text-[#00521d] [&_a]:underline [&_a]:underline-offset-4 [&_a]:transition-colors [&_a]:hover:text-[#00752d]";

type ProductInfoTabsProps = {
  descriptionHtml: string;
  selectedOptions: readonly {name: string; value: string}[];
  sku?: string | null;
  title: string;
};

export function ProductInfoTabs({
  descriptionHtml,
  selectedOptions,
  sku,
  title,
}: ProductInfoTabsProps) {
  const [activeTab, setActiveTab] = useState<InfoTab>('description');
  const baseId = useId();
  const tabRefs = useRef<Partial<Record<InfoTab, HTMLButtonElement | null>>>({});
  const additionalInformation = [
    ...selectedOptions
      .filter(
        ({name, value}) =>
          Boolean(name && value) &&
          !(name === 'Title' && value === 'Default Title'),
      )
      .map(({name, value}) => ({label: name, value})),
    ...(sku ? [{label: 'SKU', value: sku}] : []),
  ];
  const tabs: InfoTab[] = additionalInformation.length
    ? ['description', 'additional']
    : ['description'];

  function selectTab(tab: InfoTab) {
    setActiveTab(tab);
  }

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    tab: InfoTab,
  ) {
    const index = tabs.indexOf(tab);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;

    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    selectTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  }

  return (
    <section className="mt-12 rounded-[2rem] bg-[#effce9] p-6 sm:p-8 lg:mt-16 lg:p-12">
      <div
        role="tablist"
        aria-label={`${title} information`}
        className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-[#d6f3d0]"
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab;
          const label = tab === 'description' ? 'Description' : 'Additional information';

          return (
            <button
              key={tab}
              ref={(node) => {
                tabRefs.current[tab] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-${tab}-tab`}
              aria-selected={selected}
              aria-controls={`${baseId}-${tab}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
              className={`shrink-0 rounded-full px-4 py-2.5 font-heading text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#00521d] sm:px-5 ${
                selected
                  ? 'bg-[#00521d] text-white'
                  : 'text-[#347345] hover:bg-[#e2f2dd] hover:text-[#004817]'
              } motion-reduce:transition-none`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        id={`${baseId}-description-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-description-tab`}
        hidden={activeTab !== 'description'}
        className="mt-8 max-w-[48rem]"
      >
        <div
          className={PROSE}
          dangerouslySetInnerHTML={{__html: descriptionHtml}}
        />
      </div>

      {additionalInformation.length ? (
        <div
          id={`${baseId}-additional-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-additional-tab`}
          hidden={activeTab !== 'additional'}
          className="mt-8 max-w-[48rem]"
        >
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {additionalInformation.map(({label, value}) => (
              <div key={label} className="border-b border-[#ccefc8] pb-4">
                <dt className="font-heading text-sm font-bold uppercase tracking-[0.12em] text-[#347345]">
                  {label}
                </dt>
                <dd className="mt-1 text-base leading-relaxed text-[#004817]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
