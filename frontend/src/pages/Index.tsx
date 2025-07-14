import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignDetection from "@/components/SignDetection";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Title & Description */}
        <section className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Sign Language Detection
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our advanced AI system detects and interprets sign language in real-time, 
            making communication more accessible for everyone.
          </p>
        </section>

        {/* Sign Detection Component */}
        <section className="flex justify-center mb-16">
          <SignDetection />
        </section>

        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature Card 1 */}
          <div className="bg-white p-6 rounded-xl shadow-lg transition hover:shadow-xl">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Accurate Detection</h3>
            <p className="text-gray-600">
              Trained on thousands of gestures for highly precise sign recognition.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="bg-white p-6 rounded-xl shadow-lg transition hover:shadow-xl">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Processing</h3>
            <p className="text-gray-600">
              Instant feedback with lightning-fast AI detection and overlay.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="bg-white p-6 rounded-xl shadow-lg transition hover:shadow-xl">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10a3 3 0 106 0 3 3 0 00-6 0zM7 20h10m-5-10v10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Accessibility</h3>
            <p className="text-gray-600">
              Breaking barriers with technology that empowers communication.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
