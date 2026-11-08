export type NavLink = {
  label: string
  icon: string
  to: string
}

export default function (mobileOrder: boolean = false): NavLink[] {
  if (mobileOrder) {
    return [
      {
        label: "Turniere",
        icon: "i-heroicons-trophy",
        to: "/tournaments",
      },
      {
        label: "Live",
        icon: "i-heroicons-signal",
        to: "/live",
      },
      {
        label: "Medien",
        icon: "i-heroicons-newspaper",
        to: "/media",
      },
    ]
  }

  return [
    {
      label: "Live",
      icon: "i-heroicons-signal",
      to: "/live",
    },
    {
      label: "Turniere",
      icon: "i-heroicons-trophy",
      to: "/tournaments",
    },
    {
      label: "Medien",
      icon: "i-heroicons-newspaper",
      to: "/media",
    },
  ]
}
