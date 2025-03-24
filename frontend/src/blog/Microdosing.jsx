import { Header } from "./../Header";
import { Footer } from "./../Footer";
import psilocybin_potency from "/psilocybin-potency.png";
import psilocybin_stability from "/psilocybin-stability.png";

export function BlogPostMicrodosing() {
    return (
        <div id="microdosing" className="min-h-screen flex flex-col">
        <Header />
        <Microdosing />
        <Footer />
        </div>
    );
}

function Microdosing() {
    return (
        <div id="" className="bg-white px-6 py-10 sm:py-20 lg:px-8 flex-grow">
        <div className="mx-auto max-w-3xl text-lg text-gray-800">
            <h1 className="mt-2 text-pretty text-4xl font-raleway font-semibold tracking-tight text-gray-900">
                Microdosing Psilocybin Mushrooms
            </h1>
            <p className="mt-4 text-xl/8 text-gray-400">
                by Connor Davis
            </p>
        
            <p className="mt-6">
                By now you may have heard of microdosing. In case you haven't, it consists
                of taking a small dose of a psychedelic substance, such as psilocybin mushrooms,
                on some set schedule. The goal is to keep the dose small enough to avoid any 
                hallucinogenic effects yet large enough to still capture purported benefits, including
                enhanced creativity, flow states, mental clarity, and mood.
        
                In this post, you'll learn about how microdosing works, its benefits and risks, and how to get started microdosing
                with psilocybin mushrooms specifically.
        
                <br/><br/><em>A quick disclaimer: This post should not be construed as advice of any kind. It is for your information
                only. As will be evident later, decisions made based on information in this post can have serious health and legal consequences.
                Mycomize is not responsible for any of the decisions you make based on the information provided in this post.</em>
            </p>
        
            <h2 className="mt-8 text-pretty text-3xl font-raleway font-semibold tracking-tight text-gray-900">
                How Does Microdosing Work?
            </h2>
        
            <p className="mt-4">
                Microdosing refers to the ingestion of a very low dose of a psychedelic substance according to a regular protocol.
                The microdose is often described as sub-perceptual, i.e., small enough to avoid getting high. A better characterization
                would be <em>subtle</em>-perceptual, where a slight change in perception is felt, but still not enough to be impaired nor experience any psychedelic effects.
                This is in contrast to a macrodose, which is taken with the intention to produce an intense psychedelic trip that lasts for several hours.
                This begs the question, what does "small enough" mean exactly? And how does one go about measuring a proper microdose for themselves?
                The answer varies depending on the substance being used. For psilocybin containing mushroom species, the generally accepted range is 
                between 0.1 and 0.5 grams of dried mushrooms <a href="#ref1" className="text-blue-600">[1]</a>. However there are some subtle factors to consider
                before you start, and to understand them it helps to have a basic understanding of the psilocybin molecule and its contribution to
                psychoactive potency across different mushroom variants, storage conditions, and ingestion methods. Another question is, how frequently should one microdose?
                This is determined by the protocol that one chooses. Below we will see several protocols that are commonly used.
            </p>
            <br/>
            <h3 className="text-pretty text-2xl font-raleway font-semibold tracking-tight text-gray-900">
                Psilocybin and Potency
            </h3>
            <br/>
            <p className="">
                Psilocybin is a tryptamine that is a structural analog to serotonin. Psilocybin itself is inactive. It induces psychoactive effects only
                after being dephosphorylated into psilocin<a href="#ref2" className="text-blue-600"> [2]</a> by the liver. The psilocin then passes
                through the blood-brain barrier and binds to serotonin receptors, particularly the 5-HT2A receptor. The amount of psilocybin in 
                a mushroom determines its psychoactive potency. There are at least eight genera of fungi that contain psilocybin, with the <em>Psilocybe </em>
                genus being the most well-known, containing over 100 psilocybin-producing species. The most common species of <em>Psilocybe</em> mushrooms for
                cultivation are <em>Psilocybe cubensis</em>. The image below breaks down the percentage of psilocybin and psilocin across
                several <em>Psilocybe</em> species:
            </p> 
            <figure className="my-6">
                <img src={psilocybin_potency} alt="Psilocybin and Psilocin Content across various Psilocybe Species" className="rounded-md my-3 mx-auto" />
                <figcaption className="text-sm text-gray-500 text-center">Source: <a href="https://tripsitter.com/magic-mushrooms/average-potency/" className="text-blue-600"><em>Tripsitter</em></a></figcaption>
            </figure>
            <p> 
                You can see <em>Psilocybe cubensis</em> in the middle, clocking in with just under 1% of psilocybin and psilocin by weight. Within the
                <em> P. cubensis </em> species, there are many different varieties, each with various potency levels. The best resource I'm aware of
                for determining the potency of different <em> P. cubensis</em> varieties is the <a href="https://www.oaklandhyphae510.com/" className="text-blue-600">Oakland Hyphae Psilocybin Cup</a>.
                This is an annual competition that measures the psilocybin and psilocin content of each variety that is submitted. In the
                <a href="https://www.oaklandhyphae510.com/post/fall-2022-hyphae-cup" className="text-blue-600"> Fall 2022 competition</a>,
                they found the majority of <em> P. cubensis</em> varieties contained between 5-10mg of psilocybin per gram of dried mushrooms.
            </p>
            <br/>
            <p> 
                In addition to mushroom species and variety, mushroom storage is another factor in determining potency. Psilocybin oxidizes
                rapidly in the presence of light, air, and extreme temperatures, so mushrooms stored in a ziplock bag will lose potency
                faster relatve to an air-tight mason jar or vacuum-sealed bag that is kept in the dark. Generally, the older the mushrooms,
                the less potent they will be, so you have to adjust the dosage accordingly in order to acheive the desired microdose effect. Below is a
                chart that demonstrates the degradation of psilocybin mushrooms in a ziplock bag over time and under different storage conditions:
            </p>
            <figure className="my-6">
                <img src={psilocybin_stability} alt="Psilocybin stability over time" className="rounded-md my-3 mx-auto" />
                <figcaption className="text-sm text-gray-500 text-center">Source: <a href="https://analyticalsciencejournals.onlinelibrary.wiley.com/doi/epdf/10.1002/dta.2950" className="text-blue-600"><em>Gotvaldova, K., et al. 2020</em></a></figcaption>
            </figure>
            <p>
                Another factor for determining potency is method of ingestion. Many people just eat the mushrooms plain. This leads to a gradual onset 
                of effects in about 30 to 45 minutes, with peak effects around 90 minutes. Eating them plain however can occasionaly cause mild nausea
                and stomach discomfort. To help prevent this, some people grind the dried mushrooms into a powder, then soak the powder
                in lemon juice for about 20 minutes. This is called <em>lemon-tekking</em>. The low pH of the lemon juice helps to convert the psilocybin
                into psilocin, in turn making it easier to digest. However another consequence of the lemon-tek is the effects come on faster and stronger, so if you choose
                to lemon-tek, you may need to reduce the dosage to achieve the desired microdose level <a href="#ref3" className="text-blue-600"> [3]</a>. 
                Lemon-tekking is more common for large doses, but in theory it can be done for microdosing as well.
            </p>
            <br/>
            <p>
                Finally, the most important factor in determining the proper microdose is one's unique biochemistry. Everyone is different, 
                so what works for one person may not work for others. This is especially true for people on medications, including 
                those that act on the serotonin system such as SSRIs. Mixing psilocybin with SSRIs can lead to serious issues such as 
                <a href="https://en.wikipedia.org/wiki/Serotonin_syndrome" className="text-blue-600"> serotonin syndrome</a>.
                We will see additional contraindications later in the discussion on risks, but remember, none of this post should be construed as medical advice.
                Consult with a medical professional before starting any microdosing protocol. 
            </p>
            <br/>
            <p>
                Now that we have a basic understanding of psilocybin and its potency, we can discuss the microdosing protocols that are most commonly used.
            </p>
            <br/>
            <h3 className="text-pretty text-2xl font-raleway font-semibold tracking-tight text-gray-900">
                Microdosing Protocols
            </h3>
            <br/>
            <p>
                The protocol used for microdosing determines the frequency of the dose and the amount of rest between doses. The most popular protocols
                have been established by leaders in the psychedelic research community, including James Fadiman and Paul Stamets. These protocols have been
                developed mostly through anecdotal data rather clinical trial data. The reason is that psychoactive substances such
                as psilocybin are very difficult to blind in a clinical research setting. If you need hard, double-blind clinical trial data,
                then microdosing just isn't for you, at least not yet. The following protocols are described in detail in <a href="#ref3" className="text-blue-600"> [3]</a>: 
            </p>
            <ul className="my-6 ml-6 space-y-5">
                <li>
                    <h4><span className="font-semibold text-xl">Fadiman Protocol </span><br/> Named after James Fadiman, one of the pioneers of psychedelic research in the 1960s. Dose one day on, two days off. Repeat this for four to six weeks. Then take two weeks
                    completely off.</h4>
                </li>
                <li>
                    <h4><span className="font-semibold text-xl">Stamets Protocol </span><br/> Named after Paul Stamets, a legend within the mycology and psychedelic research communities. Dose for four days in a row, then take three days off.
                     Repeat for four to six weeks. Then take two weeks completely off.</h4>
                </li>
                <li>
                    <h4><span className="font-semibold text-xl">Microdosing Institute Protocol </span><br/> Dose every other day.
                     Repeat for four to six weeks. Then take two weeks completely off.</h4>
                </li>
            </ul>
        
            <p>
                As we will see in some detail below, there is anecdotal evidence of benefits from these protocols, and you can choose to experiment with different
                schedules based on your preferences and feedback from your body. The principle underlying each of these is the same:
                <em className="font-semibold"> start low, go slow, and take time off</em>. Recall the standard range of
                microdoses is 0.1 to 0.5 grams. As shown above, 
                potency can vary depending on many factors, so if it is your first time, you should start with a very small dose (less than 0.1 grams).
                Buy a scale that is accurate to hundredths of a gram so you can measure exactly how much you're taking. 
                Record how you feel based on the dose. This will allow you to ease into higher doses over time. Personally
                I stay under 0.2 grams for my microdoses, but everyone is different.
                <br/>
                <br/>
                If it is your first time, dose in a
                place where you feel comfortable, on a day when you have no responsibilities, and with someone you trust
                to be there for you just in case your body is hyper-sensitive to psilocybin or you have an extremely
                potent batch. The environment you dose in is referred to as the <em>setting</em>. Setting is very
                important for larger doses, and should also be carefully considered if microdosing will be your
                first experience with psychedelics.
                <br/>
                <br/>
                In addition to setting, the other thing to be aware of is your mindset (referred to simply as the <em>set</em>),
                going into the dose. Set captures the purpose of why you are microdosing in the first place so that you can be
                intentional throughout the protocol. It also captures your mood and stress levels. If you are super
                stressed about something, it is probably better to wait to start microdosing until you are in a better place.
                Microdosing isn't a panacea. It doesn't magically change stressful situations without your 
                intentional effort to resolve them. 

                That said, it can help you deal with stress in a more healthy way. This is one of the many benefits
                that people report from microdosing. In the next section we will survey the more sailent, and sometimes
                surprising, benefits of microdosing.
            </p>

            <h2 className="mt-8 text-pretty text-3xl font-raleway font-semibold tracking-tight text-gray-900">
                Benefits of Microdosing
            </h2>
            <br/>
            <p>
                Most of the information in this section is summarized from <a href="#ref3" className="text-blue-600"> [3]</a>, which features a collection of self-reported
                data from thousands of people who have microdosed. To date there isn't much clinical trial data on <em>microdosing &#32;</em>
                psilocybin. There was a double-blind, placebo-controlled study (n=34) by Cavanna et al. <a href="#ref4" className="text-blue-600">[4] </a>
                that found no statistically significant difference between microdosing and placebo on measures of well-being, cognitive function, and creativity.

            </p> 
        
        
            <h2 className="mt-8 text-pretty text-3xl font-raleway font-semibold tracking-tight text-gray-900">
                References
            </h2>
            <br/>
            <ul>
                <li id="ref1" className="mt-2">
                    [1] Polito, V., & Liknaitzky, P. (2022). <em>The emerging science of microdosing: A systematic review of research on low dose psychedelics (1955–2021) and recommendations for the field.</em> Neuroscience & Biobehavioral Reviews.
                </li>
                <li id="ref2" className="mt-2">
                    [2] Raphael, V., et al. (2022). <em>A Review of Synthetic Access to Therapeutic Compounds Extracted from Psilocybe.</em> Pharmaceuticals.
                </li>
                <li id="ref3" className="mt-2">
                    [3] Fadiman, J., & Gruber, J. (2025). <em>Microdosing for Health, Healing, and Enhanced Performance.</em>
                </li>
                <li id="ref4" className="mt-2">
                    [4] Cavanna et al. (2022). <em>Microdosing with psilocybin mushrooms: a double-blind placebo-controlled study.</em> Translational Psychiatry.
                </li>

            </ul>
        </div>
        </div>
    );
}