import React from 'react';
import { Button, Popup } from 'tdesign-react';
import { ChartDescription } from '../../../types/chartDescriptions';

interface ChartDescriptionComponentProps {
  description: ChartDescription;
}

export default function ChartDescriptionComponent({ description }: ChartDescriptionComponentProps) {
  const popupContent = (
    <div className="max-w-4xl p-4 bg-white rounded-lg text-sm text-gray-600 max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2 text-gray-800">{description.title}</h3>
      <div className="space-y-3">
        {description.sections.map((section, index) => (
          <div key={index}>
            <h4 className="font-semibold text-gray-700 mb-1">{section.title}</h4>
            <ul className="space-y-1 ml-2">
              {section.items.map((item, itemIndex) => (
                <li 
                  key={itemIndex} 
                  dangerouslySetInnerHTML={{ __html: item }}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {description.usageTip && (
        <div className={`mt-3 p-3 ${description.usageTip.bgColor} rounded border-l-4 ${description.usageTip.borderColor}`}>
          <p className={`${description.usageTip.textColor} text-xs`}>
            <span dangerouslySetInnerHTML={{ __html: description.usageTip.content }} />
          </p>
        </div>
      )}
    </div>
  );
  return (
    <Popup 
      trigger="hover" 
      showArrow 
      placement="bottom-left"
      content={popupContent}
      overlayStyle={{ maxWidth: '800px' }}
    >
      <Button theme="default" variant="outline" size="small">
        图表说明
      </Button>
    </Popup>
  );
}
