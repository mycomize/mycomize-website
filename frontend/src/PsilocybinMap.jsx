import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { stateLegalizationData } from "./data/psilocybinLegalizationData";

// USA GeoJSON map data URL
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const PsilocybinMap = () => {
    // Get color for a state based on legalization status
    const getStateColor = (geo) => {
        const stateId = geo.id;
        const stateData = stateLegalizationData.find(
            (state) => state.id === stateId
        );

        if (!stateData) return "#D6D6DA"; // Default gray

        switch (stateData.status) {
            case "Decriminalized":
                return "#8BC34A"; // Light green
            case "Illegal":
            default:
                return "#D6D6DA"; // Gray
        }
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            <p className="text-2xl font-bold mb-4 text-center">
                Legalization Status of Psilocybin in the United States
            </p>
            <div className="w-full aspect-[4/3] border border-gray-300 rounded-lg overflow-hidden">
                <ComposableMap
                    projection="geoAlbersUsa"
                    projectionConfig={{
                        scale: 1000,
                    }}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={getStateColor(geo)}
                                    stroke="#FFFFFF"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: {
                                            outline: "none",
                                            fill: getStateColor(geo),
                                            opacity: 0.8,
                                        },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>
                </ComposableMap>
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap justify-center gap-4 p-2 border-t border-gray-200">
                <div className="flex items-center">
                    <div className="w-5 h-5 bg-[#8BC34A] mr-2"></div>
                    <span className="text-sm">Decriminalized</span>
                </div>
                <div className="flex items-center">
                    <div className="w-5 h-5 bg-[#D6D6DA] mr-2"></div>
                    <span className="text-sm">Illegal</span>
                </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg text-sm">
                <p className="mb-2">
                    This map shows the current legal status of psilocybin
                    mushrooms for <em>personal</em> use across the United
                    States, at the state level.
                </p>
                <p className="text-xs text-gray-500">
                    Last updated: April 2025
                </p>
            </div>
        </div>
    );
};

export default PsilocybinMap;
