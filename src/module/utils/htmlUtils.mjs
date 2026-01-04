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
  const button = constructElement('button', { classes, dataset });
  button.type = type;

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

/**
 * Construct an HTML element with defined attributes.
 * @param {String} tagName HTML tag name.
 * @param {Object} [options] Options data applied to the element.
 * @param {String[]} [options.classes] A list of classes to apply to the element `classList`.
 * @param {Record<string, *>} [options.dataset] A set of `dataset` attributes passed to the element.
 * @returns {HTMLElement}
 */
export function constructElement(tagName, { classes = [], dataset = {} } = {}) {
  const el = document.createElement(tagName);
  el.classList.add(...classes);

  for (const [key, value] of Object.entries(dataset)) {
    el.dataset[key] = value;
  }

  return el;
}
