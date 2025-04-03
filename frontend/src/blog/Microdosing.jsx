import { Header } from "./../Header";
import { Footer } from "./../Footer";
import psilocybin_potency from "/psilocybin-potency.png";
import psilocybin_stability from "/psilocybin-stability.png";
import TableOfContents from "../TableOfContents";

export function BlogPostMicrodosing() {
    return (
        <div id="microdosing" className="min-h-screen flex flex-col">
            <Header />
            <Microdosing />
            <Footer />
        </div>
    );
}
const Quote = ({ children, author }) => {
    return (
        <blockquote className="p-4 my-8 border-l-4 border-gray-300 bg-gray-100">
            <p className="text-md italic font-medium leading-relaxed text-gray-500">
                {children}
            </p>
            {author && (
                <cite className="block mt-2 text-sm text-gray-600">
                    — {author}
                </cite>
            )}
        </blockquote>
    );
};

function Microdosing() {
    return (
        <>
            <div className="flex">
                <TableOfContents
                    contentSelector=".blog-content"
                    headingSelector="h1, h2, h3"
                    offset={80}
                />
                <div
                    id=""
                    className="blog-content bg-white px-6 py-10 sm:py-20 lg:px-8 flex-grow"
                >
                    <div className="mx-auto max-w-3xl text-lg text-gray-800">
                        <h1
                            id="title"
                            className="mt-2 text-pretty text-4xl font-raleway font-semibold tracking-tight text-gray-900"
                        >
                            Microdosing Psilocybin Mushrooms
                        </h1>
                        <p className="mt-4 text-xl/8 text-gray-500">
                            by Connor Davis
                        </p>
                        <p className="mt-1 text-xl/8 text-gray-400">
                            Last Updated: April 2025
                        </p>
                        <p className="mt-6">
                            By now you may have heard of microdosing. In case
                            you haven't, it consists of taking a small dose of a
                            psychedelic substance, such as psilocybin mushrooms,
                            on some set schedule. The goal is to keep the dose
                            small enough to avoid any hallucinogenic effects yet
                            large enough to still capture purported benefits,
                            including enhanced creativity, flow states, mental
                            clarity, and mood. In this post, you'll learn about
                            how microdosing works along with its benefits and
                            risks so you can make an informed decision about
                            whether microdosing is for you.
                            <br />
                            <br />
                            <em>
                                A quick disclaimer: This post should not be
                                construed as advice of any kind. It is for your
                                information only. As will be evident later,
                                decisions made based on information in this post
                                can have serious health and legal consequences.
                                Mycomize is not responsible for any of the
                                decisions you make based on the information
                                provided in this post.
                            </em>
                        </p>
                        <h2
                            id="how-does-microdosing-work"
                            className="mt-8 text-pretty text-3xl font-raleway font-semibold tracking-tight text-gray-900"
                        >
                            How Does Microdosing Work?
                        </h2>
                        <br />
                        <p>
                            Microdosing refers to the ingestion of a very low
                            dose of a psychedelic substance according to some
                            set schedule. The microdose is often described as
                            sub-perceptual, i.e., small enough to avoid getting
                            high. A better characterization would be{" "}
                            <em>subtle</em>-perceptual, where a slight change in
                            perception is felt, but still not enough to be
                            impaired nor experience any psychedelic effects.
                            This is in contrast to a macrodose, which is taken
                            with the intention to produce an intense psychedelic
                            trip that lasts for several hours.
                            <br />
                            <br />
                            This begs the question, what does "small enough"
                            mean exactly? And how does one go about measuring a
                            proper microdose for themselves? The answer varies
                            depending on the substance being used. For
                            psilocybin containing mushroom species, the
                            generally accepted range is between 0.1 and 0.5
                            grams of dried mushrooms{" "}
                            <a href="#ref1" className="text-blue-600">
                                [1]
                            </a>
                            . However there are some subtle factors to consider
                            before you start, and to understand them it helps to
                            have a basic understanding of the psilocybin
                            molecule and its contribution to psychoactive
                            potency across different mushroom variants, storage
                            conditions, and ingestion methods.
                            <br />
                            <br />
                            Another question is, how frequently should one
                            microdose? This is determined by the protocol that
                            one chooses. Below we will see several protocols
                            that are commonly used.
                        </p>
                        <br />
                        <h3
                            id="psilocybin-potency"
                            className="text-pretty text-2xl font-raleway font-semibold tracking-tight text-gray-900"
                        >
                            Psilocybin and Potency
                        </h3>
                        <br />
                        <p className="">
                            Psilocybin is a tryptamine that is a structural
                            analog to serotonin. Psilocybin itself is inactive.
                            It induces psychoactive effects only after being
                            dephosphorylated into psilocin
                            <a href="#ref2" className="text-blue-600">
                                {" "}
                                [2]
                            </a>{" "}
                            by the liver. The psilocin then passes through the
                            blood-brain barrier and binds to serotonin
                            receptors, particularly the 5-HT2A receptor. The
                            amount of psilocybin in a mushroom determines its
                            psychoactive potency. There are at least eight
                            genera of fungi that contain psilocybin, with the{" "}
                            <em>Psilocybe </em>
                            genus being the most well-known, containing over 100
                            psilocybin-producing species. The most common
                            species of <em>Psilocybe</em> mushrooms for
                            cultivation are <em>Psilocybe cubensis</em>. The
                            image below breaks down the percentage of psilocybin
                            and psilocin across several <em>Psilocybe</em>{" "}
                            species:
                        </p>
                        <figure className="my-6">
                            <img
                                src={psilocybin_potency}
                                alt="Psilocybin and Psilocin Content across various Psilocybe Species"
                                className="rounded-md my-3 mx-auto"
                            />
                            <figcaption className="text-sm text-gray-500 text-center">
                                Source:{" "}
                                <a
                                    href="https://tripsitter.com/magic-mushrooms/average-potency/"
                                    className="text-blue-600"
                                >
                                    <em>Tripsitter</em>
                                </a>
                            </figcaption>
                        </figure>
                        <p>
                            You can see <em>Psilocybe cubensis</em> in the
                            middle, clocking in with just under 1% of psilocybin
                            and psilocin by weight. Within the
                            <em> P. cubensis </em> species, there are many
                            different varieties, each with various potency
                            levels. The best resource I'm aware of for
                            determining the potency of different{" "}
                            <em> P. cubensis</em> varieties is the{" "}
                            <a
                                href="https://www.oaklandhyphae510.com/"
                                className="text-blue-600"
                            >
                                Oakland Hyphae Psilocybin Cup
                            </a>
                            . This is an annual competition that measures the
                            psilocybin and psilocin content of each variety that
                            is submitted. In the
                            <a
                                href="https://www.oaklandhyphae510.com/post/fall-2022-hyphae-cup"
                                className="text-blue-600"
                            >
                                {" "}
                                Fall 2022 competition
                            </a>
                            , they found the majority of <em>
                                {" "}
                                P. cubensis
                            </em>{" "}
                            varieties contained between 5-10mg of psilocybin per
                            gram of dried mushrooms.
                        </p>
                        <br />
                        <p>
                            In addition to mushroom species and variety,
                            mushroom storage is another factor in determining
                            potency. Psilocybin oxidizes rapidly in the presence
                            of light, air, and extreme temperatures, so
                            mushrooms stored in a ziplock bag will lose potency
                            faster relative to an air-tight mason jar or
                            vacuum-sealed bag that is kept in the dark.
                            Generally, the older the mushrooms, the less potent
                            they will be, so you have to adjust the dosage
                            accordingly in order to achieve the desired
                            microdose effect. Below is a chart that demonstrates
                            the degradation of psilocybin mushrooms in a ziplock
                            bag over time and under different storage
                            conditions:
                        </p>
                        <figure className="my-6">
                            <img
                                src={psilocybin_stability}
                                alt="Psilocybin stability over time"
                                className="rounded-md my-3 mx-auto"
                            />
                            <figcaption className="text-sm text-gray-500 text-center">
                                Source:{" "}
                                <a
                                    href="https://analyticalsciencejournals.onlinelibrary.wiley.com/doi/epdf/10.1002/dta.2950"
                                    className="text-blue-600"
                                >
                                    <em>Gotvaldova, K., et al. 2020</em>
                                </a>
                            </figcaption>
                        </figure>
                        <p>
                            Another factor for determining potency is method of
                            ingestion. Many people just eat the mushrooms plain.
                            This leads to a gradual onset of effects in about 30
                            to 45 minutes, with peak effects around 90 minutes.
                            Eating them plain however can occasionally cause
                            mild nausea and stomach discomfort. To help prevent
                            this, some people grind the dried mushrooms into a
                            powder, then soak the powder in lemon juice for
                            about 20 minutes. This is called{" "}
                            <em>lemon-tekking</em>. The low pH of the lemon
                            juice helps to convert the psilocybin into psilocin,
                            in turn making it easier to digest. However another
                            consequence of the lemon-tek is the effects come on
                            faster and stronger, so if you choose to lemon-tek,
                            you may need to reduce the dosage to achieve the
                            desired microdose level{" "}
                            <a href="#ref3" className="text-blue-600">
                                {" "}
                                [3]
                            </a>
                            . Lemon-tekking is more common for large doses, but
                            in theory it can be done for microdosing as well.
                        </p>
                        <br />
                        <p>
                            Finally, the most important factor in determining
                            the proper microdose is one's unique biochemistry.
                            Everyone is different, so what works for one person
                            may not work for others. This is especially true for
                            people on medications, including those that act on
                            the serotonin system such as SSRIs. Mixing
                            psilocybin with SSRIs can lead to serious issues
                            such as
                            <a
                                href="https://en.wikipedia.org/wiki/Serotonin_syndrome"
                                className="text-blue-600"
                            >
                                {" "}
                                serotonin syndrome
                            </a>
                            . We will see additional contraindications later in
                            the discussion on risks, but remember, none of this
                            post should be construed as medical advice. Consult
                            with a medical professional before starting any
                            microdosing protocol.
                        </p>
                        <br />
                        <p>
                            Now that we have a basic understanding of psilocybin
                            and its potency, we can discuss the microdosing
                            protocols that are most commonly used.
                        </p>
                        <br />
                        <h3
                            id="microdosing-protocols"
                            className="text-pretty text-2xl font-raleway font-semibold tracking-tight text-gray-900"
                        >
                            Microdosing Protocols
                        </h3>
                        <br />
                        <p>
                            The protocol used for microdosing determines the
                            frequency of the dose and the amount of rest between
                            doses. The most popular protocols have been
                            established by leaders in the psychedelic research
                            community, including James Fadiman and Paul Stamets.
                            These protocols have been developed mostly through
                            anecdotal data rather than clinical trial data. The
                            reason is that psychoactive substances such as
                            psilocybin are very difficult to blind in a clinical
                            research setting. If you need FDA approval to tell
                            you it's OK, then microdosing just isn't for you, at
                            least not yet. The following protocols are described
                            in detail in{" "}
                            <a href="#ref3" className="text-blue-600">
                                {" "}
                                [3]
                            </a>
                            :
                        </p>
                        <ul className="my-6 ml-5 space-y-5">
                            <li className="list-disc">
                                <h4 id="fadiman-protocol">
                                    <span className="font-semibold text-xl">
                                        Fadiman Protocol{" "}
                                    </span>
                                </h4>
                                <br /> Named after James Fadiman, one of the
                                pioneers of psychedelic research in the 1960s.
                                Dose one day on, two days off. Repeat this for
                                four to six weeks. Then take two weeks
                                completely off.
                            </li>
                            <li className="list-disc">
                                <h4 id="stamets-protocol">
                                    <span className="font-semibold text-xl">
                                        Stamets Protocol{" "}
                                    </span>
                                </h4>
                                <br /> Named after Paul Stamets, a legend within
                                the mycology and psychedelic research
                                communities. Dose for four days in a row, then
                                take three days off. Repeat for four to six
                                weeks. Then take two weeks completely off.
                            </li>
                            <li className="list-disc">
                                <h4 id="microdosing-institute-protocol">
                                    <span className="font-semibold text-xl">
                                        Microdosing Institute Protocol{" "}
                                    </span>
                                </h4>
                                <br /> Dose every other day. Repeat for four to
                                six weeks. Then take two weeks completely off.
                            </li>
                        </ul>
                        <p>
                            As we will see in some detail below, there is
                            anecdotal evidence of benefits from these protocols,
                            and you can choose to experiment with different
                            schedules based on your preferences and feedback
                            from your body. The principle underlying each of
                            these is the same:
                            <em className="font-semibold">
                                {" "}
                                start low, go slow, and take time off
                            </em>
                            . Recall the standard range of microdoses is 0.1 to
                            0.5 grams. As shown above, potency can vary
                            depending on many factors, so if it is your first
                            time, you should start with a very small dose (less
                            than 0.1 grams). Buy a scale that is accurate to
                            hundredths of a gram so you can measure exactly how
                            much you're taking. Record how you feel based on the
                            dose. This will allow you to ease into higher doses
                            over time.
                            <br />
                            <br />
                            If it is your first time taking psychedelics, dose
                            in a place where you feel comfortable, on a day when
                            you have no responsibilities, and with someone you
                            trust to be there for you just in case your body is
                            hyper-sensitive to psilocybin or you have an
                            extremely potent batch. At such low doses it is
                            unlikely to cause issues, but it is better to be
                            safe than sorry. The environment you dose in is
                            referred to as the <em>setting</em>. Setting is very
                            important for larger doses, and should also be
                            carefully considered if microdosing will be your
                            first experience with psychedelics.
                            <br />
                            <br />
                            In addition to setting, the other thing to be aware
                            of is your mindset (referred to simply as the{" "}
                            <em>set</em>), going into the dose. Set captures the
                            purpose of why you are microdosing in the first
                            place so that you can be intentional throughout the
                            protocol. It also captures your mood and stress
                            levels. If you are super stressed about something,
                            it is probably better to wait to start microdosing
                            until you are in a better place. Microdosing isn't a
                            panacea. It doesn't magically change stressful
                            situations without your intentional effort to
                            resolve them. That said, it can help you deal with
                            stress in a more healthy way. This is one of the
                            many benefits that people report from microdosing.
                            In the next section we will survey the more salient,
                            and sometimes surprising, benefits of microdosing.
                        </p>
                        <h2 className="mt-8 text-pretty text-3xl font-raleway font-semibold tracking-tight text-gray-900">
                            Benefits of Microdosing
                        </h2>
                        <br />
                        <p>
                            The information in this section is summarized from{" "}
                            <a href="#ref3" className="text-blue-600">
                                {" "}
                                [3]
                            </a>
                            , which features a collection of self-reported data
                            from thousands of people who have microdosed. These
                            reports are part of a grassroots citizen-science
                            effort led by Dr. James Fadiman at{" "}
                            <a
                                href="https://microdosingpsychedelics.com"
                                className="text-blue-600"
                            >
                                microdosingpsychedelics.com
                            </a>
                            . The reported benefits span two general categories:
                            enhanced well-being and improved health conditions.
                            The following sections provide a brief tour of the
                            reports from the book. I recommend reading the book
                            for a more comprehensive view. Keep in mind, these
                            reports are anecdotes (with a few exceptions noted
                            below), so it is not logical to draw conclusions
                            about whether microdosing specifically causes these
                            benefits without controlling for other factors.
                            However, due to the sheer volume of reports, I think
                            they provide a solid baseline for experimentation
                            and further research.
                        </p>
                        <br />
                        <h3 className="text-pretty text-2xl font-raleway font-semibold tracking-tight text-gray-900">
                            Enhanced Well-being
                        </h3>
                        <br />
                        <p>
                            Microdosing has been widely reported to enhance
                            cognition, sleep, athletic performance, and healthy
                            habit formation. A few of the cognitive benefits
                            include sustained focus, creativity, problem
                            solving, and mental clarity. Microdosing allows
                            people to enter a state of flow more easily, and
                            maintain sustained focus on difficult cognitive
                            tasks. It doesn't necessarily make one more creative
                            (at least not according to the reports so far),
                            however it has helped artists to overcome the
                            inertia and mental blocks that can prevent getting
                            started or revisiting a piece they are working on.
                            One theory for why this happens is psilocybin
                            loosens our internal filters{" "}
                            <a href="#ref4" className="text-blue-600">
                                [4]
                            </a>
                            , allowing for more free-flowing thoughts and a
                            willingness to express them. This wasn't limited to
                            writers and musicians. Students and professionals
                            across various disciplines, including business,
                            science, engineering, and mathematics found similar
                            benefits. They found they procrastinated less and
                            were less anxious about their work. They were able
                            to make creative connections in the face of
                            ambiguity and see the bigger picture more easily.
                            <br />
                            <br />
                            Other areas of enhancement were perhaps more
                            surprising, including improved sleep and sports
                            performance. A double-blind, placebo-controlled
                            study{" "}
                            <a href="#ref5" className="text-blue-600">
                                [5]
                            </a>{" "}
                            found that microdosing over forty-nine days of the
                            Fadiman protocol increased sleep by an average of 24
                            minutes on the first night off in each three day
                            round, including increased deep sleep for the
                            microdosing group. A couple caveats on this study
                            though: it was small, with only 80 people involved,
                            and it was done with LSD rather than psilocybin.
                            Draw your own conclusions.
                            <br />
                            <br />
                            For sports, there were reports of improved ability
                            to anticipate the movement and intention of others,
                            both in team sports (volleyball) and individual
                            sports (jiu-jitsu). Others in hockey, basketball,
                            and long-distance trail running reported benefits
                            such as increased reaction time, motivation,
                            coordination, and energy.
                            <br />
                            <br />
                            Others have reported that microdosing helped them
                            make healthier food choices. Improving their diet
                            wasn't their original intention, but was a positive
                            side effect. This is especially interesting given
                            there are an estimated 600 million neurons in the
                            enteric nervous system, i.e., in the human gut.
                            There have been studies{" "}
                            <a href="#ref4" className="text-blue-600">
                                [4]
                            </a>
                            <a href="#ref6" className="text-blue-600">
                                [6]
                            </a>{" "}
                            that show psilocybin induces neuroplasticity in the
                            brain, but perhaps these changes aren't restricted
                            to the neurons in the brain. Perhaps they allow for
                            increased communication between the brain{" "}
                            <em>and</em> the gut, resulting in a stronger signal
                            to eat healthier food. Eating healthier food is
                            aligned with other reports of people being able to
                            let go of destructive behaviors and addictions, such
                            as pornography, binge eating, drinking, and smoking.
                            These cases underline a general phenomenon of
                            microdosing bringing the reward system and the
                            body-mind connection back into balance.
                        </p>
                        <br />
                        <h3 className="text-pretty text-2xl font-raleway font-semibold tracking-tight text-gray-900">
                            Improved Health Conditions
                        </h3>
                        <br />
                        <p>
                            In addition to enhancing well-being, microdosing has
                            been reported to improve a variety of health
                            conditions. While many of these conditions are
                            mental as may be expected, others are, surprisingly,
                            physical.
                            <br />
                            <br />
                            <h4 className="font-semibold">ADHD</h4>
                            There are approximately 16 million adults in the
                            United States that have been diagnosed with ADHD,
                            and approximately 50% rely on some form of
                            pharmaceutical medication such as Adderall{" "}
                            <a href="#ref7" className="text-blue-600">
                                [7]
                            </a>{" "}
                            . Many have claimed that microdosing offered the
                            positive effects of Adderall without the often
                            debilitating side effects. Some were able to reduce
                            or even eliminate their use of pharmaceutical ADHD
                            medications completely. Many with ADHD reported
                            microdosing created a more calm focus as opposed to
                            a more frantic or jittery focus caused by
                            amphetamines. Microdosing was reported to improve
                            control over one's emotions and allow for greater
                            focus on intellectual tasks. Some report that
                            microdosing alone doesn't help much, however when
                            taken with ADHD medication, the microdose helps to
                            mitigate the medication's side effects.
                            <br />
                            <br />
                            <h4 className="font-semibold">Depression</h4>
                            Depression is the most common mental health
                            condition that microdosers report to{" "}
                            <a
                                href="https://microdosingpsychedelics.com"
                                className="text-blue-600"
                            >
                                microdosingpsychedelics.com
                            </a>
                            . Several people reported that microdosing helped
                            them <em>feel</em> love and joy for the first time
                            in years. One claimed that microdosing psilocybin
                            was far more effective than any legal drug they had
                            tried in the past, with essentially zero side
                            effects. Another reported that microdosing every
                            other day eliminated their suicidal thoughts and
                            enabled them to stop taking pharmaceutical
                            medications. A common theme is that microdosing
                            reconnects people with positive emotions, enabling
                            them to be felt again. This is in contrast to
                            antidepressants, which tend to indiscriminately
                            blunt every emotion, including the good ones. These
                            anecdotes are beginning to be corroborated by
                            clinical trials as well. In 2024, MindBio
                            Therapeutics completed an 8 week, open-label Phase
                            2a clinical trial of microdosing LSD for depression.
                            The trial{" "}
                            <a
                                href="https://feeds.issuerdirect.com/news-release.html?newsid=7207716577024003"
                                className="text-blue-600"
                            >
                                found
                            </a>{" "}
                            a 72% reduction in depressive symptoms, with 58% of
                            participants (n=20) achieving complete remission.
                            And these improvements were sustained in a 6-month
                            follow-up.
                            <br />
                            <br />
                            <h4 className="font-semibold">Anxiety</h4>
                            Reports on anxiety are mostly positive, however
                            there are some mixed results for generalized anxiety
                            in particular. Some reported improvements in anxiety
                            levels, while others felt the microdose amplified
                            their generalized anxiety. Other types of anxiety
                            that are more "focused", such as social anxiety,
                            anxiety about work or relationship issues, or
                            anxiety tied to another mental condition such as
                            depression were often improved by microdosing.
                            <br />
                            <br />
                            In addition to the three areas above, the book in
                            <a href="#ref3" className="text-blue-600">
                                {" "}
                                [3]{" "}
                            </a>
                            discusses several other mental afflictions which can
                            be improved, including PTSD and addiction. Now that
                            we've a feel for some of the potential mental
                            benefits, we will move on to some of the physical
                            benefits, some of which may be quite surprising.
                            <br />
                            <br />
                            <h4 className="font-semibold">
                                Cluster Headaches and Migraines
                            </h4>
                            Cluster headaches are extremely painful headaches.
                            Often described as "suicide headaches", they are
                            much more painful and debilitating than migraines,
                            and those afflicted are 22x more likely to commit
                            suicide than the general population. Many
                            citizen-scientists over at{" "}
                            <a
                                href="https://clusterbusters.org"
                                className="text-blue-600"
                            >
                                clusterbusters.org
                            </a>{" "}
                            report that sub-hallucinogenic doses of tryptamines
                            are effective at preventing and controlling the
                            severity of cluster headaches. Similar findings have
                            been reported for migraines. One reported that
                            microdosing reduced the number of migraines from
                            roughly 20 per month to 1 per month. While most
                            reports agree that there is substantial reduction in
                            the number of migraines, complete remission has not
                            been reported.
                            <br />
                            <br />
                            <h4 className="font-semibold">
                                Inflammatory Bowel Disease
                            </h4>
                            IBD is a chronic dysregulation of immune response
                            within the digestive tract. The prognosis is usually
                            poor, involving either surgery or prolonged drug
                            therapy. Many people have reported microdosing
                            helped them reduce their symptoms and reliance on
                            pharmaceutical treatments as well as avoid surgery.
                            It also helped people change their diet and exercise
                            habits that were part of a holistic treatment plan
                            of their IBD symptoms. Both <em>in vitro</em> and{" "}
                            <em>in vivo </em>&#32; models suggest one mechanism
                            for improved IBD symptoms may be due to psychedelics
                            (specifically those that act on the 5-HT2A receptor)
                            attenuating inflammatory mediators such as
                            TNF-&alpha; within the GI tract{" "}
                            <a href="#ref8" className="text-blue-600">
                                {" "}
                                [8].
                            </a>
                            &#32;It has also{" "}
                            <a
                                href="https://ibd.coach"
                                className="text-blue-600"
                            >
                                been suggested
                            </a>{" "}
                            that psychedelics may influence the composition of
                            the microbiome itself, allowing for healthier
                            bacteria to take residence in the gut, in turn
                            lowering the inflammation that is characteristic of
                            IBD.
                            <br />
                            <br />
                            <h4 className="font-semibold">Shingles</h4>
                            If you've ever had chickenpox, you are at risk of
                            developing shingles. Shingles manifests as a painful
                            rash of blisters typically in the older population.
                            There have been at least three reports of people
                            with shingles that started microdosing and found
                            that their pain was greatly reduced. It is believed
                            that this worked by reducing inflammation rather
                            than directly attacking the virus. This is part of
                            an emerging view that microdosing can be an
                            effective alternative to conventional pain
                            relievers, such as NSAIDs and opioids. A survey
                            <a href="#ref9" className="text-blue-600">
                                {" "}
                                [9]{" "}
                            </a>
                            of microdosers with chronic pain (n=127) found that
                            67% associated it with a reduction in pain and a
                            statistically significant improvement in pain
                            management over conventional means. Interestingly,
                            those who set the intention of microdosing to
                            relieve pain achieved a statistically significant
                            decrease in perceived pain than those who did not
                            set such an intention.
                            <br />
                            <br />
                            By now you may be noticing a pattern. The physical
                            conditions discussed above all tend to have an
                            inflammatory component. Indeed, while much of the
                            research on macrodoses have focused on alleviating
                            mental health conditions, there is an emerging body
                            of data on microdosing suggests that psychedelics
                            act as anti-inflammatories in the brain and in
                            peripheral tissues. Psychedelics could offer an
                            alternative form of treatment or prevention for a
                            variety of conditions that have inflammation as the
                            root cause.
                            <br />
                            <br />
                            <h3 className="text-pretty text-2xl font-raleway font-semibold tracking-tight text-gray-900">
                                What Can We Make of This?
                            </h3>
                            <br />
                            There are a lot of promising stories here and
                            emerging clinical data that is suggestive of the
                            benefits of microdosing. Skeptics often bring up the
                            placebo effect as a possible explanation for the
                            benefits reported. While one's mindset and
                            expectations are very important, especially at
                            higher doses, there has been work that shows real
                            neurophysiological changes in the brain even at
                            microdoses as measured by EEG recordings
                            <a href="#ref10" className="text-blue-600">
                                {" "}
                                [10]{" "}
                            </a>
                            . While most of the data has been anecdotal, it is
                            difficult to ignore the amount of positive reports
                            that have been collected so far. Some may balk at
                            the fact that an authority figure such as the FDA
                            hasn't approved microdosing due to a lack of hard
                            clinical trial data, however there is precedent in
                            modern medicine for depending on subjective data to
                            guide treatment.
                            <Quote>
                                Note: to the FDA's credit, they granted
                                psilocybin "breakthrough therapy" status for
                                treatment-resistant depression in 2018 and for
                                major depressive disorder in 2019.
                            </Quote>
                            Most prescriptions written for mental health
                            concerns are based on subjective patient surveys and
                            observations. At the end of the day, only you know
                            how you feel, and only you will be able to determine
                            if microdosing works or not. But before you make a
                            decision, you should be aware of some of the risks
                            associated with microdosing.
                        </p>
                        <h2 className="mt-8 text-pretty text-3xl font-raleway font-semibold tracking-tight text-gray-900">
                            Risks of Microdosing
                        </h2>
                        <br />
                        <p>
                            Risk of microdosing can be split into roughly two
                            categories: legal risk and health risk.
                            <br />
                            <br />
                            <h3 className="text-pretty text-2xl font-raleway font-semibold tracking-tight text-gray-900">
                                Legal Risk
                            </h3>
                            <br />
                            Psilocybin and other psychedelics were made illegal
                            when President Nixon passed the Controlled
                            Substances Act (CSA) in 1970. Despite the decades of
                            extensive psychiatric and neuroscientific research
                            into psychedelics that took place in the 50s and
                            60s, Nixon decided they should be considered
                            Schedule 1 substances. This means they allegedly
                            have no accepted medical use and have a high
                            potential for abuse. Based on what we know today,
                            this classification is simply disconnected from
                            reality. But the fact remains, on the federal level,
                            use, possession, or distribution of classical
                            psychedelics such as psilocybin and LSD comes with
                            stiff fines and jail time.
                            <br />
                            <br />
                            On the state level, the story is a bit more
                            complicated. While{" "}
                            <a
                                className="text-blue-600"
                                href="https://recovered.org/hallucinogens/legal-status-of-psychedelics"
                            >
                                most states have laws
                            </a>{" "}
                            that echo Nixon's "war on drugs", Colorado and
                            Oregon are first-movers in a wave of
                            decriminalization and legalization efforts. Oregon
                            passed a ballot measure in 2020 for psilocybin that
                            decriminalized personal possession and legalized
                            assisted medical use for adults. In 2022,
                            <a
                                className="text-blue-600"
                                href="https://leg.colorado.gov/sites/default/files/initiative%2520referendum_proposition%20122%20final%20lc%20packet.pdf"
                            >
                                {" "}
                                Colorado decriminalized
                            </a>{" "}
                            personal possession, use, cultivation, and gifting
                            of entheogenic plants and their psychedelic
                            compounds, including psilocybin mushrooms, ibogaine,
                            mescaline, and DMT. The same measure legalized the
                            supervised use of psilocybin at licensed therapy
                            centers, set to begin this year (2025). Several
                            cities across California, Washington, Michigan, and
                            Massachusetts have voted for similar
                            decriminalization measures, while other states{" "}
                            <a
                                className="text-blue-600"
                                href="https://www.lexisnexis.com/community/insights/legal/capitol-journal/b/state-net/posts/states-slowly-embracing-psychedelic-drugs"
                            >
                                have proposed bills
                            </a>{" "}
                            for similar changes.
                        </p>
                        <br/>
                        <h3 className="text-pretty text-2xl font-raleway font-semibold tracking-tight text-gray-900">
                            Health Risk
                        </h3>
                        <br />
                        The majority of microdosing reports are positive. Of the
                        reports that were negative, this was due to microdosing
                        not being effective at helping the condition at hand
                        rather than causing severe adverse effects. Since the
                        dose is so small, it is unlikely to cause psychological
                        distress. There have been some transient negative
                        physical effects reported, such as nausea and sleep
                        disturbances. In all reported cases, if negative effects
                        did arise, they went away by simply stopping the
                        microdosing protocol. Microdosing and psychedelics are
                        not addictive, so stopping once you start should not be
                        a problem.
                        <br />
                        <br />
                        One of the unfortunate side effects of making
                        psychedelics Schedule 1 is there is no regulated market
                        for legitimate psychedelic substances. This means you
                        need to be careful in how you source your mushrooms. If
                        you are not growing them yourself, then be sure to get
                        them from someone you trust. Be wary of any psilocybin
                        in pill form, especially from someone you don't really
                        know (like a random off the internet), as there is
                        greater risk for it being laced with other substances.
                        When you have a trustworthy source, it is easier to be
                        confident in the dose amount so that you can properly
                        measure a microdose.
                        <Quote>
                            Note: there is evidence that you should prefer
                            natural, whole mushrooms or full-spectrum mushroom
                            extract over synthetic psilocybin. Whole mushrooms
                            contain additional tryptamine alkaloids and
                            &beta;-carbolines that are believed to create an
                            entourage effect resulting in greater
                            neuroplasticity
                            <a href="#ref11" className="text-blue-600">
                                {" "}
                                [11]
                            </a>
                            . <br />
                        </Quote>
                        What if you accidentally take a large dose? In this
                        case, you should be aware of some of the more serious
                        risks so that you can make an informed decision about
                        whether to start microdosing in the first place,
                        especially if you are using an untrustworthy source.
                        <br />
                        <br />
                        Even large doses of psilocybin are physically safe as it
                        has a very low toxicity level. You would need to{" "}
                        <a
                            className="text-blue-600"
                            href="https://recovered.org/hallucinogens/psilocybin/can-you-overdose-on-shrooms"
                        >
                            {" "}
                            eat approximately 3.7 <em>pounds &#32;</em>
                            of dried mushrooms
                        </a>{" "}
                        before reaching the presumed lethal dose in humans.
                        Higher doses can lead to intense nausea, diarrhea,
                        vomiting, lack of coordination, and temperature
                        dysregulation. Psychologically, large doses can lead to
                        transient feelings of intense fear, panic, and paranoia.
                        Extremely high doses may lead to temporary states of{" "}
                        <a
                            className="text-blue-600"
                            href="https://en.wikipedia.org/wiki/Ego_death#:~:text=13%20Further%20reading-,Definitions,no%20sense%20of%20personal%20identity."
                        >
                            ego death
                        </a>{" "}
                        or{" "}
                        <a
                            className="text-blue-600"
                            href="https://www.thezenpsychedelic.com/p/ontological-shock"
                        >
                            ontological shock
                        </a>
                        . Many people who have experienced these states report
                        that they rank among the most profound and meaningful
                        experiences of their life, but nonetheless they can be
                        quite intense and scary in the moment. These issues
                        should never be a problem for a proper microdose though.
                        Start low, go slow, and take time off.
                        <br />
                        <br />
                        Lastly, you should be aware of contraindications with
                        other mental health conditions and medications. If you
                        have generalized anxiety, bipolar disorder, or
                        schizophrenia, you should do plenty of research and
                        consult with your psychiatrist before embarking on any
                        psychedelic use, including microdosing. The same goes
                        for certain medications. The authors in{" "}
                        <a href="#ref3" className="text-blue-600">
                            [3]
                        </a>{" "}
                        recommend avoiding microdosing if you are on Tramadol or
                        Lithium (they don't say why). That book contains a long
                        list of medications that people have taken alongside
                        microdosing, so be sure to check it out before you
                        start. This is not meant to be a comprehensive list of
                        contraindications. As always, consult with your doctor
                        before you make any changes.
                        <br />
                        <h2 className="mt-8 text-pretty text-3xl font-raleway font-semibold tracking-tight text-gray-900">
                            Wrapping Up
                        </h2>
                        <br />
                        <p>
                            The goal of this post was to provide you with some
                            facts around the potential of microdosing for
                            improving health and well-being. Now that you are
                            aware of some of the potential benefits and risks,
                            you should have enough information to make an
                            informed decision about whether it is right for you
                            or not. If you do decide to start, consider
                            reporting your experience to Dr. James Fadiman at{" "}
                            <a
                                href="https://microdosingpsychedelics.com"
                                className="text-blue-600"
                            >
                                microdosingpsychedelics.com
                            </a>
                            . The more data we have, the more we begin to
                            understand about these powerful substances. If you
                            are interested in learning more, I recommend reading
                            Dr. Fadiman's book
                            <a href="#ref3" className="text-blue-600">
                                {" "}
                                [3]{" "}
                            </a>
                            or perusing the{" "}
                            <a
                                className="text-blue-600"
                                href="https://reddit.com/r/microdosing"
                            >
                                r/microdosing{" "}
                            </a>
                            subreddit.
                            <br />
                            <br />
                            Good luck out there!
                        </p>
                        <h2 className="mt-8 text-pretty text-3xl font-raleway font-semibold tracking-tight text-gray-900">
                            References
                        </h2>
                        <br />
                        <ul>
                            <li id="ref1" className="mt-2">
                                [1] Polito, V., & Liknaitzky, P. (2022).{" "}
                                <a
                                    className="text-blue-600"
                                    href="https://www.sciencedirect.com/science/article/pii/S0149763422001956"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    <em>
                                        The emerging science of microdosing: A
                                        systematic review of research on low
                                        dose psychedelics (1955–2021) and
                                        recommendations for the field.
                                    </em>{" "}
                                </a>
                                Neuroscience & Biobehavioral Reviews
                            </li>
                            <li id="ref2" className="mt-2">
                                [2] Raphael, V., et al. (2022).{" "}
                                <a
                                    className="text-blue-600"
                                    href="https://www.mdpi.com/1424-8247/16/1/40"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    <em>
                                        A Review of Synthetic Access to
                                        Therapeutic Compounds Extracted from
                                        Psilocybe.
                                    </em>{" "}
                                </a>
                                Pharmaceuticals
                            </li>
                            <li id="ref3" className="mt-2">
                                [3] Fadiman, J., & Gruber, J. (2025).{" "}
                                <a
                                    className="text-blue-600"
                                    href="https://www.amazon.com/Microdosing-Health-Healing-Enhanced-Performance/dp/1250355583"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    <em>
                                        Microdosing for Health, Healing, and
                                        Enhanced Performance.
                                    </em>
                                </a>
                            </li>
                            <li id="ref4" className="mt-2">
                                [4] Siegel, J., et al. (2024).{" "}
                                <a
                                    className="text-blue-600"
                                    href="https://www.nature.com/articles/s41586-024-07624-5"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    <em>
                                        Psilocybin desynchronizes the human
                                        brain.
                                    </em>
                                </a>{" "}
                                Nature
                            </li>
                            <li id="ref5" className="mt-2">
                                [5] Allen, N., et al. (2024).{" "}
                                <a
                                    href="https://www.nature.com/articles/s41398-024-02900-4"
                                    className="text-blue-600"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    <em>
                                        LSD increases sleep duration the night
                                        after microdosing.
                                    </em>{" "}
                                </a>
                                Translational Psychiatry
                            </li>
                            <li id="ref6" className="mt-2">
                                [6] Shao, L., et al. (2022).{" "}
                                <a
                                    href="https://pubmed.ncbi.nlm.nih.gov/34228959/"
                                    className="text-blue-600"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    <em>
                                        Psilocybin induces rapid and persistent
                                        growth of dendritic spines in frontal
                                        cortex in vivo.
                                    </em>{" "}
                                </a>
                                Neuron
                            </li>
                            <li id="ref7" className="mt-2">
                                [7]{" "}
                                <a
                                    href="https://www.jilljohnsoncoaching.com/blog/latest-stats-for-2025"
                                    className="text-blue-600"
                                >
                                    https://www.jilljohnsoncoaching.com/blog/latest-stats-for-2025
                                </a>
                            </li>
                            <li id="ref8" className="mt-2">
                                [8] Flanagan, T. and Nichols, C. (2018).{" "}
                                <a
                                    href="https://pubmed.ncbi.nlm.nih.gov/30102081/"
                                    className="text-blue-600"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    <em>Psychedelics as inflammatory agents</em>
                                    .
                                </a>{" "}
                                International Review of Psychiatry
                            </li>
                            <li id="ref9" className="mt-2">
                                [9] Bonnelle, V., et al. (2022).{" "}
                                <a
                                    href="https://pubmed.ncbi.nlm.nih.gov/36452124/"
                                    className="text-blue-600"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    <em>
                                        Analgesic potential of macrodoses and
                                        microdoses of classical psychedelics in
                                        chronic pain sufferers: a population
                                        survey.
                                    </em>{" "}
                                </a>
                                British Journal of Pain
                            </li>
                            <li id="ref10" className="mt-2">
                                [10] Murray, C., et al. (2022).{" "}
                                <a
                                    href="https://pubmed.ncbi.nlm.nih.gov/34613430/"
                                    className="text-blue-600"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    <em>
                                        Low doses of LSD reduce broadband
                                        oscillatory power and modulate
                                        event-related potentials in healthy
                                        adults.{" "}
                                    </em>
                                </a>
                                Psychopharmacology
                            </li>
                            <li id="ref11" className="mt-2">
                                [11] Shahar O., et al. (2024).{" "}
                                <a
                                    href="https://www.nature.com/articles/s41380-024-02477-w"
                                    className="text-blue-600"
                                    target="_blank"
                                    rel="noreferrer noopener"
                                >
                                    <em>
                                        Effect of chemically synthesized
                                        psilocybin and psychedelic mushroom
                                        extract on molecular and metabolic
                                        profiles in mouse brain.{" "}
                                    </em>
                                </a>
                                Molecular Psychiatry
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
