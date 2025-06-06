import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900">环亚物流内部货物管理系统</h1>
        <p className="text-gray-600 mt-2">高效、专业的物流解决方案</p>
      </header>

      {/* Company Images */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">公司厂区概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg overflow-hidden shadow-md">
            <img 
              src="https://images.pexels.com/photos/1427107/pexels-photo-1427107.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
              alt="物流中心鸟瞰图" 
              className="w-full h-64 object-cover"
            />
          </div>
          <div className="rounded-lg overflow-hidden shadow-md">
            <img 
              src="https://images.pexels.com/photos/2226458/pexels-photo-2226458.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
              alt="运输车队" 
              className="w-full h-64 object-cover"
            />
          </div>
        </div>
      </div>

      {/* Company Introduction */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">公司简介</h2>
        <p className="text-gray-700 leading-relaxed">
          环亚物流有限公司成立于2010年，是一家专业的综合物流服务提供商。我们致力于为客户提供高效、安全、可靠的物流解决方案。
          公司拥有完善的仓储设施和强大的运输网络，覆盖全国各主要城市。我们的服务包括仓储管理、货物运输、配送服务等多个方面。
        </p>
        <p className="text-gray-700 leading-relaxed mt-4">
          环亚物流秉承"诚信、专业、高效"的经营理念，通过不断创新和提升服务质量，赢得了广大客户的信任和支持。
          我们承诺，将继续以客户需求为中心，提供更加优质的物流服务。
        </p>
      </div>

      {/* Management Team */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">管理团队</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden shadow-md">
              <img 
                src="https://images.pexels.com/photos/3789888/pexels-photo-3789888.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="张总经理" 
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-semibold text-blue-800">张明</h3>
            <p className="text-gray-600">总经理</p>
            <p className="text-sm text-gray-500 mt-2">
              拥有15年物流行业管理经验，负责公司整体战略规划和业务发展。
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden shadow-md">
              <img 
                src="https://cdn.i-scmp.com/sites/default/files/styles/768x768/public/d8/images/canvas/2023/03/14/11810b8b-9f8e-41db-8191-baddad0dd94e_fbbd985d.jpg?itok=IKCMC5AX&v=1678768068" 
                alt="李运营总监" 
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-semibold text-blue-800">李婷</h3>
            <p className="text-gray-600">运营总监</p>
            <p className="text-sm text-gray-500 mt-2">
              专注于仓储和物流运营管理，确保公司高效运行和客户满意度。
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden shadow-md">
              <img 
                src="https://www.fashiongonerogue.com/wp-content/uploads/2023/07/Haerin-NewJeans-Dior-Rose-des-Vents-2023-Jewelry-Campaign.jpg" 
                alt="王技术总监" 
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-semibold text-blue-800">王力</h3>
            <p className="text-gray-600">技术总监</p>
            <p className="text-sm text-gray-500 mt-2">
              负责公司信息系统和技术创新，提升物流效率和服务质量。
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">联系我们</h2>
        <div className="text-gray-700">
          <p className="mb-2"><span className="font-medium">公司电话：</span>12345678</p>
          <p><span className="font-medium">公司邮箱：</span>123@hotmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;