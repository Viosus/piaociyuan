"use client";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <button
        onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = "/")}
        className="mb-6 text-sm text-gray-500 hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
      >
        ← 返回
      </button>
      <h1 className="text-3xl font-bold mb-8 text-[var(--foreground)]">隐私政策</h1>
      <p className="text-sm text-gray-500 mb-8">最后更新日期：2026年3月26日</p>

      <div className="space-y-8 text-[var(--foreground)]">
        {/* 引言 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">引言</h2>
          <p className="leading-7">
            票次元（以下简称&ldquo;我们&rdquo;）深知个人信息对您的重要性，我们将按照中华人民共和国《个人信息保护法》（PIPL）、《网络安全法》、《数据安全法》及相关法律法规的要求，严格保护您的个人信息安全。本隐私政策适用于您通过票次元网站及移动应用（以下统称&ldquo;本平台&rdquo;）所提供的所有服务。
          </p>
          <p className="leading-7 mt-2">
            <strong>公司名称：</strong>票次元网络科技有限公司
          </p>
          <p className="leading-7 mt-1">
            <strong>注册地址：</strong>中华人民共和国
          </p>
          <p className="leading-7 mt-1">
            <strong>联系邮箱：</strong>privacy@piaociyuan.com
          </p>
          <p className="leading-7 mt-1">
            <strong>客服热线：</strong>400-XXX-XXXX
          </p>
          <p className="leading-7 mt-4">
            请您在使用本平台服务前，仔细阅读并充分理解本隐私政策。一旦您开始使用本平台服务，即视为您已阅读并同意本政策的全部内容。
          </p>
        </section>

        {/* 一、个人信息收集清单 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">一、个人信息收集清单</h2>
          <p className="leading-7 mb-4">
            为了向您提供服务，我们将在以下场景中收集和使用您的个人信息。我们仅会收集实现服务功能所必需的最少信息：
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">使用场景</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">信息类型</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">收集方式</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">使用目的</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">保留期限</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">注册登录</td>
                  <td className="border border-gray-300 px-4 py-2">手机号</td>
                  <td className="border border-gray-300 px-4 py-2">用户填写</td>
                  <td className="border border-gray-300 px-4 py-2">账号标识、验证码</td>
                  <td className="border border-gray-300 px-4 py-2">账号存续期</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">实名购票</td>
                  <td className="border border-gray-300 px-4 py-2">姓名、身份证号</td>
                  <td className="border border-gray-300 px-4 py-2">用户填写</td>
                  <td className="border border-gray-300 px-4 py-2">实名制购票</td>
                  <td className="border border-gray-300 px-4 py-2">订单完成后3年</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">支付</td>
                  <td className="border border-gray-300 px-4 py-2">支付账号</td>
                  <td className="border border-gray-300 px-4 py-2">第三方SDK</td>
                  <td className="border border-gray-300 px-4 py-2">完成交易</td>
                  <td className="border border-gray-300 px-4 py-2">不存储</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">票务服务</td>
                  <td className="border border-gray-300 px-4 py-2">收货地址</td>
                  <td className="border border-gray-300 px-4 py-2">用户填写</td>
                  <td className="border border-gray-300 px-4 py-2">配送服务</td>
                  <td className="border border-gray-300 px-4 py-2">账号存续期</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">数字藏品</td>
                  <td className="border border-gray-300 px-4 py-2">设备信息</td>
                  <td className="border border-gray-300 px-4 py-2">自动采集</td>
                  <td className="border border-gray-300 px-4 py-2">安全验证</td>
                  <td className="border border-gray-300 px-4 py-2">账号存续期</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">社区互动</td>
                  <td className="border border-gray-300 px-4 py-2">发布内容、评论</td>
                  <td className="border border-gray-300 px-4 py-2">用户填写</td>
                  <td className="border border-gray-300 px-4 py-2">社区功能</td>
                  <td className="border border-gray-300 px-4 py-2">账号存续期</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">客服反馈</td>
                  <td className="border border-gray-300 px-4 py-2">反馈内容</td>
                  <td className="border border-gray-300 px-4 py-2">用户填写</td>
                  <td className="border border-gray-300 px-4 py-2">问题处理</td>
                  <td className="border border-gray-300 px-4 py-2">处理完成后1年</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="leading-7 mt-4 text-sm text-gray-600">
            以上信息中，手机号、姓名、身份证号属于必要个人信息，不提供将无法使用对应核心功能；其余信息为可选信息，不影响基本服务的使用。
          </p>
        </section>

        {/* 二、第三方SDK清单 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">二、第三方SDK清单</h2>
          <p className="leading-7 mb-4">
            为了向您提供完善的服务，本平台集成了以下第三方SDK。我们已与这些合作方签署了数据保护协议，确保其在授权范围内处理您的个人信息：
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">SDK名称</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">用途</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">收集的信息</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">官方隐私政策</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">支付宝 SDK</td>
                  <td className="border border-gray-300 px-4 py-2">支付</td>
                  <td className="border border-gray-300 px-4 py-2">交易信息、设备标识</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <a
                      href="https://render.alipay.com/p/f/fd-iwfnkycg/index.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      alipay.com/privacy
                    </a>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">微信支付 SDK</td>
                  <td className="border border-gray-300 px-4 py-2">支付</td>
                  <td className="border border-gray-300 px-4 py-2">交易信息、设备标识</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <a
                      href="https://weixin.qq.com/cgi-bin/readtemplate?lang=zh_CN&t=weixin_agreement&s=privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      weixin.qq.com/privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Socket.io</td>
                  <td className="border border-gray-300 px-4 py-2">实时消息</td>
                  <td className="border border-gray-300 px-4 py-2">连接标识</td>
                  <td className="border border-gray-300 px-4 py-2">&mdash;</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">Expo</td>
                  <td className="border border-gray-300 px-4 py-2">应用框架</td>
                  <td className="border border-gray-300 px-4 py-2">设备信息、崩溃日志</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <a
                      href="https://expo.dev/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      expo.dev/privacy
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="leading-7 mt-4 text-sm text-gray-600">
            上述第三方SDK仅在实现对应功能所必需的范围内收集和使用您的个人信息。如您不使用相关功能，对应SDK将不会收集您的信息。
          </p>
        </section>

        {/* 三、信息使用目的 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">三、信息使用目的</h2>
          <p className="leading-7 mb-3">我们收集您的个人信息用于以下目的：</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>账号管理：</strong>创建和维护您的用户账号，提供登录认证服务。</li>
            <li><strong>票务服务：</strong>处理购票订单、实名验证、电子票生成与核验、票务转让。</li>
            <li><strong>订单处理：</strong>支付处理、订单状态更新、退款服务、发票开具。</li>
            <li><strong>社区功能：</strong>发布动态、评论互动、关注功能、私信功能。</li>
            <li><strong>数字藏品服务：</strong>数字藏品的生成、转让、展示等相关功能。</li>
            <li><strong>消息通知：</strong>活动提醒、订单状态通知、安全验证码发送。</li>
            <li><strong>个性化推荐：</strong>基于您的浏览和购买历史，为您推荐感兴趣的演出活动。</li>
            <li><strong>安全保障：</strong>风控识别、防范欺诈、保障账号安全。</li>
            <li><strong>服务改善：</strong>数据分析、功能优化、用户体验提升。</li>
          </ul>
          <p className="leading-7 mt-3">
            我们承诺不会将您的个人信息用于上述目的之外的用途。若需变更使用目的，我们将再次征得您的明示同意。
          </p>
        </section>

        {/* 四、信息共享与第三方 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">四、信息共享与第三方</h2>
          <p className="leading-7 mb-3">
            我们不会将您的个人信息出售给任何第三方。在以下情况下，我们可能会与第三方共享您的部分信息：
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>支付处理：</strong>与支付宝（蚂蚁集团）、微信支付（腾讯）共享必要的交易信息以完成支付。这些合作方仅在支付处理的范围内使用相关信息。</li>
            <li><strong>活动主办方：</strong>购票后，我们可能会向活动主办方提供您的实名信息用于入场验证，具体以活动要求为准。</li>
            <li><strong>法律要求：</strong>根据法律法规、法律程序、诉讼或政府主管部门的要求，我们可能需要披露您的个人信息。</li>
            <li><strong>安全保护：</strong>为保护票次元、用户或公众的权利、财产或安全所合理必需的情况。</li>
          </ul>
          <p className="leading-7 mt-3">
            我们与所有第三方合作方签署了严格的数据保护协议，确保您的个人信息得到与本政策同等水平的保护。
          </p>
        </section>

        {/* 五、信息存储与安全 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">五、信息存储与安全</h2>
          <h3 className="text-lg font-medium mb-3 mt-4">5.1 存储地点</h3>
          <p className="leading-7">
            您的个人信息存储在中华人民共和国境内的服务器上，我们不会将您的个人信息传输至境外。如未来因业务需要涉及跨境传输，我们将严格按照《个人信息保护法》的规定，通过安全评估并征得您的单独同意。
          </p>

          <h3 className="text-lg font-medium mb-3 mt-4">5.2 保留期限</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>账号数据：</strong>在您的账号处于活跃状态期间，我们将持续保存您的账号信息。</li>
            <li><strong>账号注销：</strong>当您提交账号注销申请后，我们将在14个自然日内完成个人信息的匿名化处理或删除。</li>
            <li><strong>交易记录：</strong>根据《电子商务法》等法律要求，订单和交易记录将在交易完成后保留不少于三年。</li>
            <li><strong>日志信息：</strong>网络日志信息保留期限不少于六个月，届满后将自动删除。</li>
          </ul>

          <h3 className="text-lg font-medium mb-3 mt-4">5.3 安全措施</h3>
          <p className="leading-7 mb-3">我们采取多种安全措施保护您的个人信息：</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>采用行业标准的加密技术（SSL/TLS）保护数据传输安全。</li>
            <li>对敏感个人信息（如身份证号、手机号）进行加密存储。</li>
            <li>用户密码使用bcrypt算法进行单向加密存储，任何人（包括我们的工作人员）均无法获取您的明文密码。</li>
            <li>建立严格的数据访问权限控制机制，仅授权人员可访问用户数据。</li>
            <li>定期进行安全评估和漏洞扫描。</li>
            <li>制定数据安全事件应急预案，一旦发生数据泄露，将及时通知受影响用户并向主管部门报告。</li>
          </ul>
        </section>

        {/* 六、用户权利 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">六、用户权利</h2>
          <p className="leading-7 mb-3">
            根据《个人信息保护法》，您对您的个人信息享有以下权利：
          </p>

          <h3 className="text-lg font-medium mb-2 mt-4">6.1 查询权</h3>
          <p className="leading-7">
            您有权查阅我们持有的关于您的个人信息。您可以通过&ldquo;我的账号&rdquo;页面查看和管理您的个人资料，也可以通过下方联系方式向我们请求获取您的个人信息副本。
          </p>

          <h3 className="text-lg font-medium mb-2 mt-4">6.2 更正权</h3>
          <p className="leading-7">
            当您发现我们持有的个人信息不准确或不完整时，您有权要求我们更正或补充。您可以在&ldquo;个人设置&rdquo;中直接修改部分信息，或联系我们协助更正。
          </p>

          <h3 className="text-lg font-medium mb-2 mt-4">6.3 删除权</h3>
          <p className="leading-7">
            在以下情形中，您可以要求我们删除您的个人信息：
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>处理目的已实现、无法实现或者为实现处理目的不再必要；</li>
            <li>我们停止提供服务，或者保存期限已届满；</li>
            <li>您撤回同意；</li>
            <li>我们违反法律、行政法规或违反约定处理个人信息；</li>
            <li>法律、行政法规规定的其他情形。</li>
          </ul>

          <h3 className="text-lg font-medium mb-2 mt-4">6.4 注销账号</h3>
          <p className="leading-7">
            您可以通过&ldquo;设置&rdquo;中的&ldquo;注销账号&rdquo;功能提交账号注销申请。账号注销后，我们将停止为您提供服务，并在14个自然日内删除或匿名化处理您的个人信息。但法律法规另有规定的除外（如交易记录需保留不少于三年）。
          </p>

          <h3 className="text-lg font-medium mb-2 mt-4">6.5 撤回同意权</h3>
          <p className="leading-7">
            您可以随时撤回之前给予的同意。撤回同意不影响撤回前基于同意所进行的个人信息处理活动的合法性。您可以通过关闭设备权限（如位置、相机、通知）或联系我们来撤回同意。
          </p>

          <h3 className="text-lg font-medium mb-2 mt-4">6.6 导出权</h3>
          <p className="leading-7">
            您有权以可读格式获取您的个人信息副本。如需导出数据，请通过下方联系方式与我们联系，我们将在十五个工作日内为您处理。
          </p>
        </section>

        {/* 七、Cookie政策 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">七、Cookie政策</h2>
          <p className="leading-7 mb-3">
            我们使用Cookie和类似技术来提供和改善我们的服务：
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>必要性Cookie：</strong>用于维持登录状态、保障账号安全，这些Cookie是网站正常运行所必需的。</li>
            <li><strong>功能性Cookie：</strong>用于记住您的偏好设置（如语言、主题），提升使用体验。</li>
            <li><strong>分析性Cookie：</strong>用于了解用户如何使用本平台，帮助我们优化产品和服务。</li>
          </ul>
          <p className="leading-7 mt-3">
            您可以通过浏览器设置管理或删除Cookie。请注意，禁用必要性Cookie可能导致部分功能无法正常使用。
          </p>
        </section>

        {/* 八、未成年人保护 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">八、未成年人保护</h2>
          <p className="leading-7">
            我们高度重视未成年人个人信息的保护。本平台的服务主要面向年满14周岁及以上的用户。
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>若您是未满14周岁的未成年人，请在您的父母或其他监护人的陪同和指导下阅读本政策，并在取得监护人同意的前提下使用我们的服务和提交个人信息。</li>
            <li>我们将按照国家相关法律法规的要求，对不满14周岁未成年人的个人信息提供更为严格的保护措施，包括但不限于对其个人信息进行加密存储和严格访问控制。</li>
            <li>若我们发现在未事先获得可证实的监护人同意的情况下收集了不满14周岁未成年人的个人信息，将尽快删除相关信息。</li>
            <li>监护人如认为我们在未获得其同意的情况下处理了其被监护人的个人信息，请通过下方联系方式与我们联系，我们将及时核实并处理。</li>
            <li>未满18周岁的未成年人在使用数字藏品相关功能时，需在监护人的指导下进行，且不得进行超出其民事行为能力范围的交易。</li>
          </ul>
        </section>

        {/* 九、隐私政策更新 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">九、隐私政策更新</h2>
          <p className="leading-7">
            我们可能会不时更新本隐私政策。当发生重大变更时，我们将通过以下方式通知您：
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>在本平台首页或显著位置发布公告；</li>
            <li>通过站内消息或推送通知向您发送更新提醒；</li>
            <li>在您下次登录时弹出更新提示，要求您重新阅读并同意。</li>
          </ul>
          <p className="leading-7 mt-3">
            变更后的隐私政策将在发布之日起生效。若您在隐私政策变更后继续使用本平台服务，即表示您同意接受变更后的隐私政策。若您不同意变更后的内容，请停止使用本平台服务，并可以通过注销账号的方式终止使用。
          </p>
        </section>

        {/* 十、联系方式 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">十、联系方式</h2>
          <p className="leading-7">
            如果您对本隐私政策有任何疑问、意见或建议，或者希望行使您的个人信息权利，请通过以下方式与我们联系：
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>平台名称：</strong>票次元</li>
            <li><strong>运营主体：</strong>票次元网络科技有限公司</li>
            <li><strong>联系邮箱：</strong>privacy@piaociyuan.com</li>
            <li><strong>客服热线：</strong>400-XXX-XXXX</li>
            <li><strong>办公地址：</strong>中华人民共和国</li>
            <li><strong>个人信息保护负责人邮箱：</strong>dpo@piaociyuan.com</li>
          </ul>
          <p className="leading-7 mt-3">
            我们将在收到您的请求后十五个工作日内予以答复。如果您对我们的答复不满意，您可以向履行个人信息保护职责的部门投诉或举报，也可以依法向人民法院提起诉讼。
          </p>
        </section>
      </div>
    </div>
  );
}
