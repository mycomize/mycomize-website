// import { useState } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    // ZoomableGroup, // Commented out zoom functionality
} from "react-simple-maps";
import { stateLegalizationData } from "./data/psilocybinLegalizationData";

// USA GeoJSON map data URL
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const PsilocybinMap = () => {
    // Tooltip state and handlers (commented out)
    /*
    const [tooltipContent, setTooltipContent] = useState("");
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [showTooltip, setShowTooltip] = useState(false);

    // Generate tooltip content for a state
    const getTooltipContent = (geo) => {
        const stateId = geo.id;
        const stateName = geo.properties.name;
        const stateData = stateLegalizationData.find(
            (state) => state.id === stateId
        );

        if (!stateData) return `${stateName}: No data available`;

        return `${stateName}: ${stateData.status}\n${stateData.details || ""}`;
    };

    const handleMouseMove = (event) => {
        // Position tooltip to the left of the mouse pointer
        setTooltipPosition({
            x: event.clientX, // Use exact cursor X position
            y: event.clientY, // Use exact cursor Y position
        });
    };

    const handleMouseEnter = (geo) => {
        setTooltipContent(getTooltipContent(geo));
        setShowTooltip(true);
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
    };
    */

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
                    {/* ZoomableGroup commented out */}
                    {/* <ZoomableGroup> */}
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
                                    // Mouse event handlers commented out
                                    /*
                                        onMouseEnter={() =>
                                            handleMouseEnter(geo)
                                        }
                                        onMouseLeave={handleMouseLeave}
                                        */
                                />
                            ))
                        }
                    </Geographies>
                    {/* </ZoomableGroup> */}
                </ComposableMap>
            </div>

            {/* Tooltip (commented out)
            {showTooltip && (
                <div
                    className="absolute bg-white px-2 py-1 rounded shadow-md text-sm z-10 pointer-events-none whitespace-pre-wrap max-w-[250px] border border-gray-200"
                    style={{
                        top: tooltipPosition.y,
                        left: tooltipPosition.x,
                        // Position tooltip very close to cursor
                        transform: `translate(-100%, ${
                            tooltipPosition.y > window.innerHeight - 100
                                ? "-100%"
                                : "0"
                        })`,
                    }}
                >
                    {tooltipContent}
                </div>
            )}
            */}

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
