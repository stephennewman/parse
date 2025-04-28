import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // Assuming you use shadcn/ui utils

// Other existing icons...
import { Home, FileText, Database } from 'lucide-react'; // <-- Import Database icon

// ... other imports and component definition ...

export function Sidebar() {
  const pathname = usePathname();

  // Assuming your navigation links are structured something like this:
  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/forms', label: 'Forms', icon: FileText }, // Example existing link
    { href: '/submissions', label: 'Submissions', icon: FileText }, // Example existing link
    { href: '/labels', label: 'Labels', icon: Database }, // Added Labels link
    { href: '/data', label: 'Data', icon: Database },
  ];

  return (
    <nav className="flex flex-col space-y-1 p-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900',
            pathname === item.href ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
            // Adjust classes based on your actual styling
          )}
        >
          <item.icon
            className={cn(
              'mr-3 h-5 w-5 flex-shrink-0',
              pathname === item.href ? 'text-gray-700' : 'text-gray-500 group-hover:text-gray-600'
              // Adjust classes based on your actual styling
            )}
            aria-hidden="true"
          />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// ... rest of the component ... 