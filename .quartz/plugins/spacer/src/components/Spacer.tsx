import type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
} from "@quartz-community/types";

const spacerCss = `.spacer {
  flex: 2 1 auto;
}`;

const Spacer: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = (_props: QuartzComponentProps) => {
    return <div class="spacer"></div>;
  };

  Component.css = spacerCss;

  return Component;
};

export default Spacer;
