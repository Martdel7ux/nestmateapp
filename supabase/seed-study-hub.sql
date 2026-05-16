-- ============================================================================
-- Nestmate — Courses seed data
-- ============================================================================
-- Realistic course codes from the major universities in Cyprus.
-- Naming conventions follow each university's actual prefix system:
--   UNIC: subject prefix + 3-digit number (e.g. COMP-101, MED-205)
--         100-499 = undergraduate, 500+ = graduate
--   UCY:  2-3 letter prefix + 3-digit number (e.g. EPL131, MAS101)
--         EPL = Computer Science, MAS = Mathematics & Statistics
--   CUT:  subject prefix + 3-digit number
--   EUC:  similar convention to UNIC
--   Generic: prefix + 3-digit number, no university attached
-- ============================================================================

INSERT INTO courses (code, title, university, department, description) VALUES

-- =============================================================
-- University of Nicosia (UNIC)
-- =============================================================

-- Computer Science & Engineering
('COMP-101', 'Introduction to Computer Science', 'University of Nicosia', 'Computer Science', 'Foundational concepts of computing, problem solving, and an overview of the field.'),
('COMP-102', 'Programming Principles I', 'University of Nicosia', 'Computer Science', 'Introduction to programming using a high-level language, control structures, and basic data types.'),
('COMP-201', 'Programming Principles II', 'University of Nicosia', 'Computer Science', 'Object-oriented programming, data structures, and software design principles.'),
('COMP-202', 'Data Structures and Algorithms', 'University of Nicosia', 'Computer Science', 'Linked lists, trees, graphs, sorting, searching, and complexity analysis.'),
('COMP-205', 'Discrete Mathematics', 'University of Nicosia', 'Computer Science', 'Logic, sets, relations, functions, combinatorics, and graph theory for computer science.'),
('COMP-301', 'Database Systems', 'University of Nicosia', 'Computer Science', 'Relational model, SQL, normalization, transactions, and database design.'),
('COMP-302', 'Operating Systems', 'University of Nicosia', 'Computer Science', 'Processes, threads, scheduling, memory management, file systems, and concurrency.'),
('COMP-305', 'Computer Networks', 'University of Nicosia', 'Computer Science', 'TCP/IP, OSI layers, routing, network security, and modern protocols.'),
('COMP-310', 'Software Engineering', 'University of Nicosia', 'Computer Science', 'Software development lifecycle, requirements engineering, testing, and project management.'),
('COMP-401', 'Artificial Intelligence', 'University of Nicosia', 'Computer Science', 'Search, knowledge representation, machine learning fundamentals, and neural networks.'),
('COMP-405', 'Web Technologies', 'University of Nicosia', 'Computer Science', 'HTML, CSS, JavaScript, modern frameworks, and full-stack web development.'),
('COMP-410', 'Cybersecurity Fundamentals', 'University of Nicosia', 'Computer Science', 'Cryptography basics, network security, ethical hacking, and risk management.'),
('DLT-301', 'Blockchain and Distributed Ledger Technology', 'University of Nicosia', 'Computer Science', 'Bitcoin, Ethereum, smart contracts, and decentralized application architecture.'),

-- Business & Economics
('BUSN-101', 'Introduction to Business', 'University of Nicosia', 'Business Administration', 'Overview of business functions, organizational structures, and the global business environment.'),
('ACCT-101', 'Principles of Financial Accounting', 'University of Nicosia', 'Accounting', 'Accounting cycle, financial statements, and an introduction to GAAP and IFRS.'),
('ACCT-201', 'Managerial Accounting', 'University of Nicosia', 'Accounting', 'Cost behavior, budgeting, variance analysis, and decision-making frameworks.'),
('ECON-101', 'Principles of Microeconomics', 'University of Nicosia', 'Economics', 'Supply and demand, consumer behavior, market structures, and welfare economics.'),
('ECON-102', 'Principles of Macroeconomics', 'University of Nicosia', 'Economics', 'GDP, inflation, unemployment, monetary policy, and international trade.'),
('MKTG-201', 'Principles of Marketing', 'University of Nicosia', 'Marketing', 'Marketing mix, consumer behavior, segmentation, and digital marketing fundamentals.'),
('FIN-301', 'Corporate Finance', 'University of Nicosia', 'Finance', 'Time value of money, capital budgeting, capital structure, and dividend policy.'),
('MGT-301', 'Organizational Behavior', 'University of Nicosia', 'Management', 'Individual and group behavior, motivation, leadership, and organizational culture.'),

-- Law & International Relations
('LAW-101', 'Introduction to Law', 'University of Nicosia', 'Law', 'Legal systems, sources of law, and the structure of the Cypriot and EU legal framework.'),
('LAW-205', 'European Union Law', 'University of Nicosia', 'Law', 'EU institutions, treaties, the four freedoms, and the relationship with member-state law.'),
('LAW-301', 'Contract Law', 'University of Nicosia', 'Law', 'Formation of contracts, terms, breach, and remedies under common law and Cypriot law.'),
('IR-201', 'Introduction to International Relations', 'University of Nicosia', 'Social Sciences', 'Major theories of international relations, global governance, and contemporary issues.'),

-- Psychology & Social Sciences
('PSY-101', 'Introduction to Psychology', 'University of Nicosia', 'Psychology', 'Biological, cognitive, developmental, social, and clinical perspectives in psychology.'),
('PSY-205', 'Developmental Psychology', 'University of Nicosia', 'Psychology', 'Human development from infancy through adulthood across cognitive, social, and emotional domains.'),
('SOWK-101', 'Introduction to Social Work', 'University of Nicosia', 'Social Work', 'History, values, and methods of professional social work practice.'),

-- Medicine & Health Sciences (undergraduate-accessible courses only)
('NUTR-101', 'Introduction to Nutrition', 'University of Nicosia', 'Nutrition and Dietetics', 'Macronutrients, micronutrients, dietary guidelines, and nutritional assessment.'),
('NUTR-205', 'Clinical Nutrition', 'University of Nicosia', 'Nutrition and Dietetics', 'Medical nutrition therapy for chronic diseases and clinical conditions.'),

-- Architecture & Engineering
('ARCH-101', 'Architectural Design I', 'University of Nicosia', 'Architecture', 'Fundamentals of architectural design, spatial composition, and representation.'),
('BENG-101', 'Engineering Mathematics I', 'University of Nicosia', 'Engineering', 'Calculus, linear algebra, and differential equations for engineering applications.'),
('BENG-201', 'Engineering Mechanics', 'University of Nicosia', 'Engineering', 'Statics and dynamics of particles and rigid bodies.'),

-- =============================================================
-- University of Cyprus (UCY)
-- =============================================================

-- Computer Science (EPL)
('EPL131', 'Principles of Programming I', 'University of Cyprus', 'Computer Science', 'Introduction to imperative programming, control structures, functions, arrays, and pointers.'),
('EPL132', 'Principles of Programming II', 'University of Cyprus', 'Computer Science', 'Object-oriented programming in Java, classes, inheritance, polymorphism, and collections.'),
('EPL231', 'Data Structures and Algorithms', 'University of Cyprus', 'Computer Science', 'Abstract data types, trees, graphs, hashing, and algorithmic complexity.'),
('EPL232', 'Programming Techniques and Tools', 'University of Cyprus', 'Computer Science', 'Advanced programming, version control, debugging, and Unix tools.'),
('EPL233', 'Object-Oriented Programming', 'University of Cyprus', 'Computer Science', 'Advanced OOP concepts, design patterns, and large-scale software development.'),
('EPL323', 'Software Engineering', 'University of Cyprus', 'Computer Science', 'Requirements analysis, software design, testing, and project management.'),
('EPL342', 'Databases', 'University of Cyprus', 'Computer Science', 'Relational databases, SQL, query optimization, transactions, and NoSQL systems.'),
('EPL371', 'Computer Networks', 'University of Cyprus', 'Computer Science', 'Network architectures, TCP/IP, routing protocols, and application-layer protocols.'),
('EPL421', 'Operating Systems', 'University of Cyprus', 'Computer Science', 'Process management, scheduling, memory, file systems, and concurrency.'),
('EPL445', 'Internet Technologies', 'University of Cyprus', 'Computer Science', 'Web architectures, HTTP, REST APIs, modern web frameworks, and cloud computing.'),
('EPL448', 'Data Mining on the Web', 'University of Cyprus', 'Computer Science', 'Web data extraction, search engines, recommender systems, and large-scale analytics.'),
('EPL451', 'Big Data Management', 'University of Cyprus', 'Computer Science', 'Distributed data systems, MapReduce, Spark, and modern big data architectures.'),

-- Mathematics & Statistics (MAS)
('MAS101', 'Calculus I', 'University of Cyprus', 'Mathematics and Statistics', 'Limits, derivatives, applications of differentiation, and introduction to integration.'),
('MAS102', 'Calculus II', 'University of Cyprus', 'Mathematics and Statistics', 'Techniques of integration, sequences, series, and multivariable calculus basics.'),
('MAS121', 'Linear Algebra I', 'University of Cyprus', 'Mathematics and Statistics', 'Vector spaces, matrices, determinants, eigenvalues, and linear transformations.'),
('MAS201', 'Probability Theory', 'University of Cyprus', 'Mathematics and Statistics', 'Sample spaces, random variables, distributions, expectation, and the central limit theorem.'),
('MAS458', 'Statistical Data Analysis', 'University of Cyprus', 'Mathematics and Statistics', 'Regression, ANOVA, hypothesis testing, and modern data analysis techniques.'),

-- Business & Economics
('DMSA101', 'Introduction to Business', 'University of Cyprus', 'Business and Public Administration', 'Foundations of business administration, management, and organizational theory.'),
('OIK101', 'Principles of Economics I', 'University of Cyprus', 'Economics', 'Microeconomic principles, consumer and producer behavior, and market structures.'),
('OIK102', 'Principles of Economics II', 'University of Cyprus', 'Economics', 'Macroeconomic principles, national income, monetary theory, and policy.'),

-- =============================================================
-- Cyprus University of Technology (CUT)
-- =============================================================

('EE-101', 'Introduction to Electrical Engineering', 'Cyprus University of Technology', 'Electrical Engineering', 'Circuits, signals, and an overview of electrical engineering disciplines.'),
('ME-101', 'Introduction to Mechanical Engineering', 'Cyprus University of Technology', 'Mechanical Engineering', 'Mechanical systems, thermodynamics overview, and engineering design process.'),
('CIE-201', 'Structural Mechanics', 'Cyprus University of Technology', 'Civil Engineering', 'Analysis of beams, frames, and trusses under static loading.'),
('MMA-301', 'Multimedia Design', 'Cyprus University of Technology', 'Multimedia and Graphic Arts', 'Visual communication, typography, and interactive multimedia production.'),
('HMG-201', 'Hospitality Management', 'Cyprus University of Technology', 'Hotel and Tourism Management', 'Operations, service quality, and management of hospitality enterprises.'),
('NUR-101', 'Foundations of Nursing', 'Cyprus University of Technology', 'Nursing', 'Nursing theory, ethics, and introduction to clinical practice.'),

-- =============================================================
-- European University Cyprus (EUC)
-- =============================================================

('CSC-101', 'Introduction to Computer Science', 'European University Cyprus', 'Computer Science', 'Computing fundamentals, problem solving, and overview of the discipline.'),
('CSC-201', 'Object-Oriented Programming', 'European University Cyprus', 'Computer Science', 'Java and OOP principles, design patterns, and software construction.'),
('PHM-101', 'Introduction to Pharmacy', 'European University Cyprus', 'Pharmacy', 'Pharmacy profession, drug development pipeline, and pharmaceutical ethics.'),
('PED-101', 'Introduction to Education', 'European University Cyprus', 'Education', 'Philosophical, sociological, and psychological foundations of education.'),
('SPS-201', 'Exercise Physiology', 'European University Cyprus', 'Sports Science', 'Physiological responses and adaptations to exercise across systems of the body.'),

-- =============================================================
-- Generic / cross-university courses (no university attached)
-- =============================================================
-- Useful for the long tail of common subjects students take across institutions

('GEN-101', 'Academic Writing in English', NULL, 'General Studies', 'Essay structure, argumentation, citation, and academic style in English.'),
('GEN-102', 'Critical Thinking', NULL, 'General Studies', 'Logic, argument analysis, common fallacies, and structured reasoning.'),
('GEN-201', 'Introduction to Research Methods', NULL, 'General Studies', 'Qualitative and quantitative research design, sampling, and ethics.'),
('STAT-101', 'Introduction to Statistics', NULL, 'Mathematics and Statistics', 'Descriptive statistics, probability, inference, and an introduction to regression.'),
('CALC-101', 'Calculus I', NULL, 'Mathematics and Statistics', 'Limits, continuity, differentiation, and introductory integration.'),
('PHYS-101', 'Physics I: Mechanics', NULL, 'Physics', 'Kinematics, Newton''s laws, energy, momentum, and rotational dynamics.'),
('CHEM-101', 'General Chemistry I', NULL, 'Chemistry', 'Atomic structure, bonding, stoichiometry, and basic thermochemistry.'),
('BIO-101', 'General Biology I', NULL, 'Biology', 'Cell biology, biochemistry basics, genetics, and evolution.'),
('LANG-EL1', 'Modern Greek for Beginners', NULL, 'Languages', 'A1-level Modern Greek for non-native speakers: alphabet, basic grammar, daily conversation.'),
('LANG-EL2', 'Modern Greek Intermediate', NULL, 'Languages', 'A2-B1 Modern Greek: grammar consolidation, reading, and conversational fluency.')

ON CONFLICT (university, code) DO NOTHING;
