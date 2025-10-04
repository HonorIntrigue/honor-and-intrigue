/**
 * A utility method to construct an HTML button.
 * @param {Object} options
 * @param {String[]} [options.classes] A list of classes to apply to the button.
 * @param {Record<string, *>} [options.dataset] Dataset info.
 * @param {Boolean} [options.disabled = false] Flag to disable the button.
 * @param {String} [options.icon] A FontAwesome icon name.
 * @param {String} [options.img] A URL image path, which takes priority over the `icon` field.
 * @param {String} [options.label] Label for the button.
 * @param {HTMLButtonElement['type']} [options.type = 'button'] Button type.
 * @returns {HTMLButtonElement}
 */
export function constructButton({ classes = [], dataset = {}, disabled = false, icon = '', img = '', label = '', type = 'button' }) {
  const button = document.createElement('button');
  button.type = type;

  button.classList.add(...classes);

  for (const [key, value] of Object.entries(dataset)) {
    button.dataset[key] = value;
  }

  if (disabled) {
    button.disabled = true;
  }

  let image = '';

  if (img) {
    image = `<img src="${img}" alt="${label}">`;
  } else if (icon) {
    image = `<i class="${icon}"></i>`;
  }

  button.innerHTML = `${image}${label}`;

  return button;
}
