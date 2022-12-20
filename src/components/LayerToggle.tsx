import { Component } from 'solid-js';

type LayerToggleProps = {
  label: string;
  update: (value: boolean) => void;
  defaultValue: boolean;
};

export const LayerToggle: Component<LayerToggleProps> = (props) => {
  const id = Math.random().toString();

  return (
    <div>
      <input
        class="cursor-pointer"
        type="checkbox"
        id={id}
        onInput={(e) => props.update(e.target['checked'])}
        checked={props.defaultValue}
      />
      <label class="select-none" for={id}>
        {' ' + props.label}
      </label>
    </div>
  );
};
