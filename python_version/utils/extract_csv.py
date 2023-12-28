import csv

def process_csv(file_path):
    # Read the CSV file into a list of dictionaries
    with open(file_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data_list = [row for row in reader if row[''] == '']
        for data in data_list:
            del data['']

    # Check if all fields exist
    if all(key in data_list[0] for key in ['first_name', 'email', 'company']):
        email_templates = []

        for data in data_list:
            email_templates.append({
                "recipient_name": data["first_name"],
                "recipient_company": data["company"],
                "email": data["email"],
                "subject": f"""New Opportunities for {data["company"]}""",
                "message": f"""                    
                <p>
                    Hello {data["first_name"]},
                </p>
                <p>
                    I'm Alex, the Lead Project Manager at <a href="https://www.example.com" target="_blank">Example Company</a>. Our CEO, John Doe, suggested I get in touch with you to explore potential collaborations that could enhance your brand's visibility and growth.
                </p>
                <p>
                    We have a proven history of helping our partners achieve significant milestones, from securing media coverage to organizing memorable events and creating impactful social media campaigns. <a href="https://www.example.com/our-work" target="_blank">Here's a link</a> to some of our previous projects.
                </p>
                <p>
                    Would you be available for a brief discussion this week? Alternatively, if there's someone else in your team who would be the right person to talk to, I'd appreciate it if you could point me in their direction.
                </p>
                <p>
                    Thank you in advance!
                </p>                
                """
            })

        return data_list, email_templates
    
    return 'Required fields are missing in the CSV file.', 400