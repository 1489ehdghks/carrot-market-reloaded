import Link from "next/link";
import { PencilIcon } from "@heroicons/react/24/outline";

interface EditButtonProps {
  productId: number;
}

export default function EditButton({ productId }: EditButtonProps) {
  return (
    <Link
      href={`/products/${productId}/edit`}
      className="absolute right-20 top-6 text-neutral-200 hover:text-orange-600 transition-colors"
    >
      <PencilIcon className="w-7 h-7" />
    </Link>
  );
}