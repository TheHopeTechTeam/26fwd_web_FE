/* @ds-bundle: {"format":4,"namespace":"TheHopeDesignSystem_66e3da","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"MediaCard","sourcePath":"components/core/MediaCard.jsx"},{"name":"SectionHeading","sourcePath":"components/core/SectionHeading.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"5c511bd31a7c","components/core/Button.jsx":"8572f204c7e0","components/core/Input.jsx":"eb7545907a00","components/core/MediaCard.jsx":"9acea5040d58","components/core/SectionHeading.jsx":"bda241003771","components/core/Tag.jsx":"538fa94097e5"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TheHopeDesignSystem_66e3da = window.TheHopeDesignSystem_66e3da || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
/** Small pill label. tone: gold | outline | neutral. */
function Badge({
  children,
  tone = 'gold'
}) {
  const tones = {
    gold: {
      background: 'var(--hope-gold)',
      color: 'var(--text-on-gold)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--hope-gold)',
      border: '1px solid var(--border-gold)'
    },
    neutral: {
      background: 'var(--gray-700)',
      color: 'var(--hope-white)'
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 'var(--text-label)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      padding: '6px 14px',
      borderRadius: 'var(--radius-full)',
      display: 'inline-block',
      ...tones[tone]
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
/** Primary brand action. variant: solid-gold | outline | ghost. size: md | lg. */
function Button({
  children,
  variant = 'solid-gold',
  size = 'md',
  icon,
  disabled,
  onClick,
  type = 'button'
}) {
  const pad = size === 'lg' ? '16px 32px' : '12px 24px';
  const fontSize = size === 'lg' ? 'var(--text-body-lg)' : 'var(--text-body)';
  const base = {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize,
    padding: pad,
    borderRadius: 'var(--radius-full)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent',
    transition: 'background var(--duration-base) var(--ease-standard), color var(--duration-base) var(--ease-standard), transform var(--duration-fast) var(--ease-out)',
    opacity: disabled ? 0.45 : 1
  };
  const variants = {
    'solid-gold': {
      background: 'var(--hope-gold)',
      color: 'var(--text-on-gold)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--hope-white)',
      borderColor: 'var(--border-gold)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--hope-gold)'
    }
  };
  const style = {
    ...base,
    ...variants[variant]
  };
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    disabled: disabled,
    onClick: onClick,
    style: style,
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.background = variant === 'solid-gold' ? 'var(--hope-gold-bright)' : 'rgba(224,176,0,.12)';
    },
    onMouseLeave: e => {
      if (!disabled) e.currentTarget.style.background = variants[variant].background;
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'scale(.97)';
    },
    onMouseUp: e => {
      if (!disabled) e.currentTarget.style.transform = 'scale(1)';
    }
  }, icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
/** Text input for forms (signup, contact). */
function Input({
  label,
  placeholder,
  type = 'text',
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      fontFamily: 'var(--font-sans)'
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-small)',
      fontWeight: 600,
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    type: type,
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body)',
      color: 'var(--text-primary)',
      background: 'var(--surface-card-raised)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-sm)',
      padding: '14px 16px',
      outline: 'none',
      transition: 'border-color var(--duration-base) var(--ease-standard)'
    },
    onFocus: e => e.currentTarget.style.borderColor = 'var(--hope-gold)',
    onBlur: e => e.currentTarget.style.borderColor = 'var(--border-subtle)'
  }));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/MediaCard.jsx
try { (() => {
/** Media card for podcast/video/sermon content. */
function MediaCard({
  image,
  eyebrow,
  title,
  meta,
  onClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      cursor: onClick ? 'pointer' : 'default',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      width: '100%',
      maxWidth: 320
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '16/10',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      background: `var(--gray-700) url(${image}) center/cover`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)'
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 'var(--text-label)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      color: 'var(--hope-gold)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: 'var(--text-body-lg)',
      color: 'var(--text-primary)'
    }
  }, title), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-small)',
      color: 'var(--text-secondary)'
    }
  }, meta)));
}
Object.assign(__ds_scope, { MediaCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/MediaCard.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionHeading.jsx
try { (() => {
/** Section title block. Combines display headline with optional accent word and sans-weight kicker. */
function SectionHeading({
  eyebrow,
  title,
  accent,
  kicker,
  align = 'left'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: align,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)'
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 'var(--text-label)',
      letterSpacing: 'var(--tracking-widest)',
      textTransform: 'uppercase',
      color: 'var(--hope-gold)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      textTransform: 'uppercase',
      fontSize: 'var(--text-display-2)',
      lineHeight: 'var(--leading-tight)',
      color: 'var(--text-primary)'
    }
  }, title, accent && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      textTransform: 'uppercase',
      color: 'var(--hope-gold)',
      fontSize: '1.3em',
      lineHeight: 1
    }
  }, accent)), kicker && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: 'var(--text-h3)',
      color: 'var(--text-secondary)'
    }
  }, kicker));
}
Object.assign(__ds_scope, { SectionHeading });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionHeading.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
/** Chip-style tag, used for filters/topics. */
function Tag({
  children,
  active = false,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: 'var(--text-small)',
      padding: '8px 16px',
      borderRadius: 'var(--radius-full)',
      cursor: onClick ? 'pointer' : 'default',
      background: active ? 'var(--hope-gold)' : 'transparent',
      color: active ? 'var(--text-on-gold)' : 'var(--text-secondary)',
      border: `1px solid ${active ? 'transparent' : 'var(--border-subtle)'}`,
      transition: 'all var(--duration-base) var(--ease-standard)'
    }
  }, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.MediaCard = __ds_scope.MediaCard;

__ds_ns.SectionHeading = __ds_scope.SectionHeading;

__ds_ns.Tag = __ds_scope.Tag;

})();
