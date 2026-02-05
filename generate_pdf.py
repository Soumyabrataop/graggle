import sys
import os

# Add local lib to path
sys.path.append(os.path.join(os.getcwd(), 'lib'))

from fpdf import FPDF

class EssayPDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.cell(0, 10, 'Essay: Importance of Trees', border=False, align='C')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')

def create_essay():
    pdf = EssayPDF()
    pdf.add_page()
    pdf.set_font("Times", size=12)
    
    content = [
        "Trees are often called the \"lungs of the Earth,\" and for good reason. They are fundamental to the survival of almost every living organism on our planet. Beyond their aesthetic beauty, trees play a critical role in maintaining the ecological balance, supporting biodiversity, and mitigating the effects of climate change.",
        
        "One of the most vital functions of trees is their role in the carbon cycle. Through the process of photosynthesis, trees absorb carbon dioxide (a greenhouse gas) and release oxygen. A single mature tree can provide enough oxygen for two people for an entire year. By sequestering carbon in their trunks, branches, and leaves, trees help reduce the overall concentration of CO2 in the atmosphere, making them a natural defense against global warming.",
        
        "Trees are also essential for soil health and water management. Their extensive root systems hold the soil in place, preventing erosion caused by wind and rain. Furthermore, trees facilitate the absorption of rainwater into the ground, which replenishes groundwater levels and reduces the risk of flooding. In urban areas, trees help manage stormwater runoff and filter pollutants before they enter our water systems.",
        
        "Biodiversity is another area where trees are indispensable. They provide habitat, food, and protection for a vast array of wildlife, including birds, insects, and mammals. Forests are home to more than 80% of the world's terrestrial biodiversity. When we cut down trees, we destroy these intricate ecosystems, leading to the extinction of various species and disrupting the natural food chain.",
        
        "Beyond environmental benefits, trees significantly impact human well-being. They provide us with timber, fruits, and medicine. In cities, they help lower temperatures by providing shade and through evapotranspiration, reducing the \"urban heat island\" effect. Moreover, numerous studies have shown that spending time around trees can reduce stress, improve mental health, and increase overall happiness.",
        
        "In conclusion, trees are not just a luxury; they are a necessity for life. They protect our climate, our soil, our water, and our health. As the primary guardians of our environment, it is our collective responsibility to plant more trees and protect our existing forests to ensure a sustainable and healthy future for generations to come."
    ]

    for paragraph in content:
        pdf.multi_cell(0, 10, paragraph)
        pdf.ln(5)

    pdf.output("importance_of_trees.pdf")
    print("PDF created successfully: importance_of_trees.pdf")

if __name__ == "__main__":
    create_essay()
