const ValidityLegend = () => {
  return (
    <div className="flex-shrink-0">
      <div className="rounded-lg border bg-white p-3 shadow-sm">
        <h5 className="mb-2 text-xs font-medium text-gray-700">
          Status de Validade
        </h5>
        <div className="grid grid-cols-1 gap-x-3 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-black"></span>
            <span>Vencido</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-900"></span>
            <span>≤ 3 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span>4-7 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
            <span>8-15 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            <span>16-30 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span>&gt; 30 dias</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidityLegend;
