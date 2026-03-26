export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8 text-[var(--foreground)]">服务条款</h1>
      <p className="text-sm text-gray-500 mb-8">最后更新日期：2026年3月26日</p>

      <div className="space-y-8 text-[var(--foreground)]">
        {/* 一、条款接受 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">一、条款接受</h2>
          <p className="leading-7">
            欢迎使用票次元（以下简称"本平台"）。本服务条款（以下简称"本条款"）是您与票次元之间就使用本平台所提供的票务、数字藏品、社区互动等服务所订立的协议。
          </p>
          <p className="leading-7 mt-2">
            请您在注册或使用本平台服务前，仔细阅读本条款的全部内容。一旦您注册账号、使用本平台服务或以其他方式表示同意，即视为您已充分理解并同意接受本条款的全部内容，本条款对双方具有法律约束力。
          </p>
          <p className="leading-7 mt-2">
            如果您不同意本条款的任何内容，请立即停止使用本平台服务。
          </p>
        </section>

        {/* 二、账号注册与管理 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">二、账号注册与管理</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>您需要使用有效的手机号码或电子邮箱注册账号，并设置安全密码。</li>
            <li>购买演出门票时，根据国家相关法规要求，您需要提供真实身份信息进行实名认证。</li>
            <li>您应妥善保管账号信息和登录凭据，因账号信息泄露导致的损失由您自行承担。</li>
            <li>每个自然人仅可注册一个账号，不得将账号转让、出借或与他人共享。</li>
            <li>如您发现账号存在异常使用情况，请立即联系我们进行处理。</li>
            <li>您有权随时注销账号。注销后，您的个人信息将在14个自然日内被匿名化处理，但订单和交易记录将按法律要求予以保留。</li>
          </ul>
        </section>

        {/* 三、票务购买规则 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">三、票务购买规则</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>本平台提供的门票均为官方正规渠道票品，票价以页面显示为准。</li>
            <li>购票时，您需选择票档、数量，并在规定时间内完成支付。超时未支付的订单将自动取消，已锁定的票品将释放。</li>
            <li>门票实行实名制，入场时需核验购票人身份信息，请确保填写的实名信息准确无误。</li>
            <li><strong>转让规则：</strong>门票仅可通过本平台提供的官方转让功能进行转让，不得通过第三方渠道倒卖。</li>
            <li><strong>禁止倒卖：</strong>严禁利用本平台进行门票黄牛倒卖行为。一经发现，我们有权立即冻结相关账号，取消违规订单，并保留追究法律责任的权利。</li>
            <li>每场活动可能设有单人购票数量限制，具体以活动详情页说明为准。</li>
          </ul>
        </section>

        {/* 四、退款政策 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">四、退款政策</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>退款政策由活动主办方制定，具体退款规则以活动详情页的说明为准。</li>
            <li>对于支持退款的活动，您需在活动开始前48小时（含）提交退款申请。</li>
            <li>退款将原路返回至您的支付账户，到账时间取决于支付渠道，通常为1-7个工作日。</li>
            <li>以下情况不予退款：
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>活动明确标注"不可退款"的门票。</li>
                <li>活动开始前不足48小时提交的退款申请。</li>
                <li>已使用（已检票入场）的门票。</li>
                <li>通过转让功能获得的门票（需联系原购买者处理）。</li>
              </ul>
            </li>
            <li>因不可抗力（如自然灾害、政府政策等）导致活动取消的，我们将协调主办方为您办理全额退款。</li>
          </ul>
        </section>

        {/* 五、数字藏品条款 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">五、数字藏品条款</h2>
          <p className="leading-7 mb-3 text-sm text-gray-500">
            （数字藏品功能即将上线，届时将适用以下条款）
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>本平台提供的数字藏品（包括但不限于3D票根、纪念徽章、数字海报等）由本平台生成发行，具有唯一性和不可篡改性。</li>
            <li>购买或获得数字藏品后，您将获得该藏品的展示权和收藏权，但不包含对应的知识产权。</li>
            <li>数字藏品可通过本平台提供的转让功能进行赠送或转让，但不得用于任何形式的金融炒作或投机行为。</li>
            <li>数字藏品一经购买或领取成功，除法律规定的情形外，不支持退款。</li>
            <li>本平台不对数字藏品的未来价值作任何承诺或保证。</li>
          </ul>
        </section>

        {/* 六、社区公约 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">六、社区公约</h2>
          <p className="leading-7 mb-3">
            本平台提供社区动态、评论互动等功能。您在使用社区功能时，须遵守以下规则：
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>发布的内容须符合中华人民共和国法律法规，不得包含违法违规信息。</li>
            <li>禁止发布含有仇恨言论、种族歧视、人身攻击、诽谤侮辱等内容。</li>
            <li>禁止发布色情、暴力、恐怖等不良信息。</li>
            <li>禁止发布垃圾广告、恶意营销、虚假信息。</li>
            <li>禁止骚扰、跟踪或威胁其他用户。</li>
            <li>尊重他人的知识产权，不得未经授权转载、传播他人的作品。</li>
            <li>不得利用社区功能进行刷量、刷评等违规行为。</li>
          </ul>
          <p className="leading-7 mt-3">
            违反社区公约的用户，我们将根据违规程度采取警告、删除内容、禁言、封禁账号等处理措施。
          </p>
        </section>

        {/* 七、用户行为规范 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">七、用户行为规范</h2>
          <p className="leading-7 mb-3">您在使用本平台服务时，不得从事以下行为：</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>利用技术手段（包括但不限于脚本、机器人、爬虫等）抢票或干扰平台正常运行。</li>
            <li>伪造、篡改门票信息或交易记录。</li>
            <li>冒充他人身份注册或使用账号。</li>
            <li>利用平台漏洞获取不正当利益。</li>
            <li>未经授权访问、收集其他用户的个人信息。</li>
            <li>从事任何可能损害本平台或其他用户合法权益的行为。</li>
          </ul>
        </section>

        {/* 八、知识产权 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">八、知识产权</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>本平台的名称、标识、界面设计、软件代码、文案内容等均受知识产权法律保护，未经我们书面许可，不得以任何方式使用。</li>
            <li>您在本平台发布的原创内容，其知识产权归您所有。但您同意授予本平台在平台范围内展示、传播您发布内容的非独占、免费许可。</li>
            <li>如果您认为本平台上的内容侵犯了您的知识产权，请通过联系方式向我们提交侵权通知，我们将依法及时处理。</li>
          </ul>
        </section>

        {/* 九、责任限制 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">九、责任限制</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>本平台作为票务服务和信息中介平台，我们尽力确保信息的准确性，但不对活动主办方提供的活动信息的完整性和准确性承担保证责任。</li>
            <li>因不可抗力（包括但不限于自然灾害、政府行为、网络攻击等）导致服务中断或数据丢失的，我们不承担责任，但将尽力采取合理措施减少影响。</li>
            <li>因您自身原因（如账号信息泄露、实名信息填写错误等）导致的损失，由您自行承担。</li>
            <li>在法律允许的最大范围内，本平台对间接损失、附带损失或惩罚性赔偿不承担责任。</li>
          </ul>
        </section>

        {/* 十、争议解决 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">十、争议解决</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>本条款的订立、执行、解释及争议解决均适用中华人民共和国法律（不含冲突法规定）。</li>
            <li>因本条款或使用本平台服务产生的任何争议，双方应首先通过友好协商解决。</li>
            <li>协商不成的，任何一方均有权向本平台所在地有管辖权的人民法院提起诉讼。</li>
          </ul>
        </section>

        {/* 十一、条款变更 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">十一、条款变更</h2>
          <p className="leading-7">
            我们保留随时修改本条款的权利。当条款发生重大变更时，我们将通过平台公告、站内消息或其他显著方式通知您。
          </p>
          <p className="leading-7 mt-2">
            变更后的条款自发布之日起生效。若您在条款变更后继续使用本平台服务，即表示您同意接受变更后的条款。若您不同意变更后的内容，请停止使用本平台服务并注销您的账号。
          </p>
        </section>

        {/* 十二、联系我们 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">十二、联系我们</h2>
          <p className="leading-7">
            如果您对本服务条款有任何疑问或建议，请通过以下方式与我们联系：
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>平台名称：票次元</li>
            <li>联系邮箱：support@piaociyuan.com</li>
            <li>客服热线：400-XXX-XXXX</li>
            <li>办公地址：中华人民共和国</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
