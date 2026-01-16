"use client";

import { WalletConnectButton, MyNFTList } from "@/components/NFTComponents";

export default function NFTsClient() {
  return (
    <div className="min-h-screen bg-[#E0DFFD] p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-[#E0DFFD] to-blue-400 bg-clip-text text-transparent">
              我的次元收藏
            </h1>
            <p className="text-[#46467A]/70 mt-1">
              区块链数字资产，永久保存，可在OpenSea等平台交易
            </p>
          </div>
          <WalletConnectButton />
        </div>

        {/* 次元说明卡片 */}
        <div className="bg-white rounded-lg p-6 mb-6 border-l-4 border-purple-500">
          <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            关于次元数字藏品
          </h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>什么是次元？</strong> 次元是独立的3D建模/AR数字艺术品，基于NFT（Non-Fungible
              Token）技术存储在区块链上，具有唯一性、不可篡改性和可追溯性。
            </p>
            <p>
              <strong>如何领取次元？</strong>{" "}
              验票后，在订单详情页连接钱包即可领取对应的次元藏品到您的账户。
            </p>
            <p>
              <strong>次元有什么用？</strong>{" "}
              作为永久数字收藏、在OpenSea等平台展示和交易、证明您参加过该活动的独特艺术品。
            </p>
          </div>
        </div>

        {/* 次元列表 */}
        <div className="bg-white rounded-lg p-6">
          <MyNFTList />
        </div>
      </div>
    </div>
  );
}
