interface HeaderProps {
  titulo: string;
  onBack?: () => void;
}

export function Header({ titulo, onBack }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-blue-600 text-white shadow-md z-40">
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="mr-3 p-1 hover:bg-blue-700 rounded"
            aria-label="Volver"
          >
            ← 
          </button>
        )}
        <h1 className="text-lg font-semibold truncate">{titulo}</h1>
      </div>
    </header>
  );
}
