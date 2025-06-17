'use client';

import { useState } from 'react';
import "./globals.css";
import CollapsibleSidebar from "./components/layout/CollapsibleSidebar";
import TeamDisplay from "./components/team/TeamDisplay";
import ChartRenderer from "./components/ChartRenderer";
import PageLoader from "./components/ui/PageLoader";
import Header from "./components/layout/Header";
import MemberDetail from "./components/team/MemberDetail";
import { teamMembersMap } from "@/types/teamMembers";

export default function Home() {
  const [currentChart, setCurrentChart] = useState<string | null>(null);
  const [showTeamDisplay, setShowTeamDisplay] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const handleChartSelect = (chartType: string) => {
    setCurrentChart(chartType);
    setShowTeamDisplay(false);
    setSelectedMember(null);
  };

  const handleHomeReturn = () => {
    setShowTeamDisplay(true);
    setSelectedMember(null);
  };

  const handleMemberSelect = (memberName: string) => {
    setShowTeamDisplay(false);
    setCurrentChart(null);
    setSelectedMember(memberName);
  };

  return (
    <PageLoader minLoadTime={0}>
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        {/* 顶部导航栏 - 固定高度10% */}
        <header className="h-[5vh] flex-shrink-0">
          <Header onMemberSelect={handleMemberSelect} />
        </header>
        {/* 主要内容区域 - 固定高度90% */}
        <main className="h-[95vh] flex gap-4 p-4 flex-shrink-0">
          {/* 侧边栏组件 */}
          <div className="h-full">
            <CollapsibleSidebar 
              onChartSelect={handleChartSelect} 
              onHomeReturn={handleHomeReturn} 
            />
          </div>
          
          {/* 右侧主要内容区域 - 自适应宽度 */}
          <section className="draw-area flex-1 h-full bg-white border-2 border-black p-6 relative overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
              {showTeamDisplay ? (
                <TeamDisplay />
              ) : selectedMember ? (
                <MemberDetail 
                  memberName={selectedMember}
                  memberInfo={teamMembersMap[selectedMember]}
                />
              ) : (
                <ChartRenderer chartType={currentChart} />
              )}
            </div>
          </section>
        </main>
      </div>
    </PageLoader>
  );
}
